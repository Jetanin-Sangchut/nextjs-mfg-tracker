import { OrderStatus, StepLogStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"

type ResourceEntry = { resourceId: string; stepSequence: number; qtyUsed: number }

export async function POST(req: Request) {
  const body = await req.json()
  const { orderNumber, productName, qty, resources } = body as {
    orderNumber: string
    productName: string
    qty: number
    resources: ResourceEntry[]
  }

  if (!orderNumber) return err("orderNumber is required")
  if (!productName) return err("productName is required")
  if (!qty || qty < 1) return err("qty must be at least 1")
  if (!resources || !Array.isArray(resources) || resources.length === 0)
    return err("resources must be a non-empty array")

  const existing = await prisma.order.findUnique({ where: { orderNumber } })
  if (existing) return err("Order number already exists", 409)

  const steps = await prisma.step.findMany({ orderBy: { sequenceOrder: "asc" } })
  if (steps.length === 0) return err("Steps not configured", 500)

  for (const entry of resources) {
    const step = steps.find((s) => s.sequenceOrder === entry.stepSequence)
    if (!step) return err(`Invalid stepSequence: ${entry.stepSequence}`)
  }

  const dbResources = await Promise.all(
    resources.map((entry) => prisma.resource.findUnique({ where: { id: entry.resourceId } }))
  )

  for (let i = 0; i < resources.length; i++) {
    const dbResource = dbResources[i]
    if (!dbResource) return err("Resource not found", 404)
    if (dbResource.availableQty < resources[i].qtyUsed)
      return err(`Insufficient resource: ${dbResource.name}`, 409)
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: { orderNumber, productName, qty, status: OrderStatus.PENDING, currentStepId: steps[0].id },
    })

    const logs = await Promise.all(
      steps.map((step) =>
        tx.orderStepLog.create({
          data: {
            orderId: created.id,
            stepId: step.id,
            status: StepLogStatus.IN_PROGRESS,
            actionNote: `Queued for step ${step.sequenceOrder}`,
          },
        })
      )
    )

    await Promise.all(
      resources.map((entry) => {
        const log = logs.find((l) => {
          const step = steps.find((s) => s.sequenceOrder === entry.stepSequence)
          return step && l.stepId === step.id
        })!
        return Promise.all([
          tx.resource.update({
            where: { id: entry.resourceId },
            data: { availableQty: { decrement: entry.qtyUsed } },
          }),
          tx.resourceConsumption.create({
            data: { orderStepLogId: log.id, resourceId: entry.resourceId, qtyUsed: entry.qtyUsed },
          }),
        ])
      })
    )

    return created
  })

  return ok({ orderId: order.id, orderNumber: order.orderNumber, productName: order.productName, qty: order.qty }, 201)
}
