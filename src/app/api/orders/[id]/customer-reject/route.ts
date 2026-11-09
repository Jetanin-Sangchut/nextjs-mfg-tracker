import { OrderStatus, StepLogStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"

type Context = { params: Promise<{ id: string }> }

export async function POST(req: Request, context: Context) {
  const { id: orderId } = await context.params
  const body = await req.json().catch(() => ({}))
  const reason = (body as { reason?: string }).reason

  const order = await prisma.order.findUnique({ where: { id: orderId, isDeleted: false } })
  if (!order) return err("Order not found", 404)
  if (order.status !== OrderStatus.COMPLETED)
    return err(`Order cannot be customer-rejected from status ${order.status}`, 409)

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CUSTOMER_REJECTED },
    })
    if (order.currentStepId) {
      await tx.orderStepLog.create({
        data: {
          orderId,
          stepId: order.currentStepId,
          status: StepLogStatus.COMPLETED,
          completedAt: new Date(),
          actionNote: reason ?? "Customer rejected",
        },
      })
    }
  })

  return ok({ customerRejected: true, reason: reason ?? null })
}
