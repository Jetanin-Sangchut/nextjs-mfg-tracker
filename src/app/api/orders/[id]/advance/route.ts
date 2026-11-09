import { OrderStatus, StepLogStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"
import { restoreWorkerResources } from "@/lib/restore-resources"

type Context = { params: Promise<{ id: string }> }

export async function POST(_: Request, context: Context) {
  const { id: orderId } = await context.params

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { currentStep: true },
  })
  if (!order) return err("Order not found", 404)
  if (order.status === OrderStatus.COMPLETED) return err("Order is already completed")

  const steps = await prisma.step.findMany({ orderBy: { sequenceOrder: "asc" } })
  if (steps.length === 0) return err("No steps configured")

  const currentSeq = order.currentStep?.sequenceOrder ?? 0
  const nextStep = steps.find(({ sequenceOrder }) => sequenceOrder > currentSeq)

  await prisma.$transaction(async (tx) => {
    if (order.currentStepId) {
      const currentLog = await tx.orderStepLog.findFirst({
        where: { orderId, stepId: order.currentStepId, status: StepLogStatus.IN_PROGRESS },
        include: { resourceConsumptions: { include: { resource: true } } },
      })
      if (currentLog) {
        await tx.orderStepLog.update({
          where: { id: currentLog.id },
          data: { status: StepLogStatus.COMPLETED, completedAt: new Date() },
        })
        await restoreWorkerResources(tx, currentLog.resourceConsumptions)
      }
    }

    if (nextStep) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.IN_PROGRESS, currentStepId: nextStep.id },
      })
      await tx.orderStepLog.create({
        data: { orderId, stepId: nextStep.id, status: StepLogStatus.IN_PROGRESS, actionNote: `Moved to ${nextStep.name}` },
      })
    } else {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED, currentStepId: order.currentStepId },
      })
    }
  })

  return ok({ completed: !nextStep, stepName: nextStep?.name ?? null })
}
