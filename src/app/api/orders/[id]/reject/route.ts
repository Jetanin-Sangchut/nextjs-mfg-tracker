import { OrderStatus, StepLogStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"
import { restoreWorkerResources } from "@/lib/restore-resources"

type Context = { params: Promise<{ id: string }> }

export async function POST(req: Request, context: Context) {
  const { id: orderId } = await context.params
  const body = await req.json().catch(() => ({}))
  const reason = (body as { reason?: string }).reason

  const order = await prisma.order.findUnique({ where: { id: orderId, isDeleted: false } })
  if (!order) return err("Order not found", 404)
  if (order.status !== OrderStatus.PENDING)
    return err(`Order cannot be rejected from status ${order.status}`, 409)

  const stepLogs = await prisma.orderStepLog.findMany({
    where: { orderId },
    include: { resourceConsumptions: { include: { resource: true } } },
  })

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.REJECTED } })
    await tx.orderStepLog.updateMany({
      where: { orderId },
      data: { status: StepLogStatus.COMPLETED, completedAt: new Date(), actionNote: reason ?? "Rejected by operator" },
    })
    for (const log of stepLogs) {
      await restoreWorkerResources(tx, log.resourceConsumptions)
    }
  })

  return ok({ rejected: true })
}
