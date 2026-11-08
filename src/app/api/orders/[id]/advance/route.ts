import { OrderStatus, StepLogStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"

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

  if (order.currentStepId) {
    await prisma.orderStepLog.updateMany({
      where: { orderId, stepId: order.currentStepId, status: StepLogStatus.IN_PROGRESS },
      data: { status: StepLogStatus.COMPLETED, completedAt: new Date() },
    })
  }

  if (!nextStep) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, currentStepId: null },
    })
    return ok({ completed: true, stepName: null })
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.IN_PROGRESS, currentStepId: nextStep.id },
    }),
    prisma.orderStepLog.create({
      data: {
        orderId,
        stepId: nextStep.id,
        status: StepLogStatus.IN_PROGRESS,
        actionNote: `Moved to ${nextStep.name}`,
      },
    }),
  ])

  return ok({ completed: false, stepName: nextStep.name })
}
