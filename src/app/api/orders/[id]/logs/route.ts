import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"

type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, context: Context) {
  const { id } = await context.params

  const order = await prisma.order.findUnique({
    where: { id, isDeleted: false },
    include: {
      orderStepLogs: {
        include: {
          step: true,
          resourceConsumptions: { include: { resource: true } },
        },
        orderBy: { startedAt: "asc" },
      },
    },
  })

  if (!order) return err("Order not found", 404)
  return ok(order)
}
