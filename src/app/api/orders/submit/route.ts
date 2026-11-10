import { revalidatePath } from "next/cache"
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

  const uniqueResourceIds = [...new Set(resources.map((e) => e.resourceId))]
  const dbResources = await prisma.resource.findMany({ where: { id: { in: uniqueResourceIds } } })
  const dbResourceMap = new Map(dbResources.map((r) => [r.id, r]))

  for (const id of uniqueResourceIds) {
    if (!dbResourceMap.has(id)) return err("Resource not found", 404)
  }

  const totalByResource = new Map<string, number>()
  for (const entry of resources) {
    totalByResource.set(entry.resourceId, (totalByResource.get(entry.resourceId) ?? 0) + entry.qtyUsed)
  }
  for (const [id, total] of totalByResource) {
    const r = dbResourceMap.get(id)!
    if (r.availableQty < total) return err(`Insufficient resource: ${r.name}`, 409)
  }

  let order
  try {
    order = await prisma.$transaction(async (tx) => {
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

      // Aggregate decrements by resourceId to avoid concurrent same-row updates
      for (const [id, total] of totalByResource) {
        await tx.resource.update({
          where: { id },
          data: { availableQty: { decrement: total } },
        })
      }

      await Promise.all(
        resources.map((entry) => {
          const step = steps.find((s) => s.sequenceOrder === entry.stepSequence)!
          const log = logs.find((l) => l.stepId === step.id)!
          return tx.resourceConsumption.create({
            data: { orderStepLogId: log.id, resourceId: entry.resourceId, qtyUsed: entry.qtyUsed },
          })
        })
      )

      return created
    }, { timeout: 30000 })
  } catch (e) {
    console.error("[orders/submit]", e)
    return err("Failed to create order", 500)
  }

  revalidatePath("/orders")
  revalidatePath("/dashboard")
  return ok({ orderId: order.id, orderNumber: order.orderNumber, productName: order.productName, qty: order.qty }, 201)
}
