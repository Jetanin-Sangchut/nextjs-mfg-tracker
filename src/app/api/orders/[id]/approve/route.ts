import { OrderStatus, StepLogStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"
import { restoreWorkerResources } from "@/lib/restore-resources"

type Context = { params: Promise<{ id: string }> }

export async function POST(_: Request, context: Context) {
  const { id: orderId } = await context.params

  const order = await prisma.order.findUnique({ where: { id: orderId, isDeleted: false } })
  if (!order) return err("Order not found", 404)
  if (order.status !== OrderStatus.PENDING)
    return err(`Order cannot be approved from status ${order.status}`, 409)

  const stepLogs = await prisma.orderStepLog.findMany({
    where: { orderId },
    include: { resourceConsumptions: { include: { resource: true } }, step: true },
    orderBy: { step: { sequenceOrder: "asc" } },
  })
  if (stepLogs.length === 0) return err("No step logs found for order", 500)

  const lastStepId = stepLogs[stepLogs.length - 1].stepId
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    for (const log of stepLogs) {
      await tx.orderStepLog.update({
        where: { id: log.id },
        data: { status: StepLogStatus.COMPLETED, completedAt: now, actionNote: "Auto-completed on approve" },
      })
      await restoreWorkerResources(tx, log.resourceConsumptions)
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, currentStepId: lastStepId },
    })
  })

  return ok({ completed: true })
}
