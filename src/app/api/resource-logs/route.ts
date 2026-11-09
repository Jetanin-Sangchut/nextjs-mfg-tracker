import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"
import { StepLogStatus } from "@prisma/client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")

  const consumptions = await prisma.resourceConsumption.findMany({
    where: orderId
      ? { orderStepLog: { orderId } }
      : undefined,
    include: {
      resource: { select: { id: true, name: true, unit: true, type: true } },
      orderStepLog: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          order: { select: { id: true, orderNumber: true, productName: true, status: true } },
          step: { select: { id: true, name: true, sequenceOrder: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return ok(consumptions)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { orderStepLogId, resourceId, qtyUsed } = body

  if (!orderStepLogId) return err("orderStepLogId is required")
  if (!resourceId) return err("resourceId is required")
  if (qtyUsed == null) return err("qtyUsed is required")
  if (qtyUsed <= 0) return err("qtyUsed must be > 0")

  const stepLog = await prisma.orderStepLog.findUnique({ where: { id: orderStepLogId } })
  if (!stepLog) return err("Step log not found", 404)
  if (stepLog.status === StepLogStatus.COMPLETED) return err("Step already completed", 409)

  const consumption = await prisma.resourceConsumption.create({
    data: { orderStepLogId, resourceId, qtyUsed },
  })
  return ok(consumption, 201)
}
