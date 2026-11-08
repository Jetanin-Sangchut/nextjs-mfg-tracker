import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"
import { OrderStatus } from "@prisma/client"

type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, context: Context) {
  const { id } = await context.params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      currentStep: true,
      orderStepLogs: {
        include: {
          step: true,
          resourceConsumptions: { include: { resource: true } },
        },
      },
    },
  })

  if (!order) return err("Order not found", 404)
  return ok(order)
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params
  const body = await request.json()
  const { productName, qty, status } = body

  if (productName == null && qty == null && status == null) {
    return err("No fields to update")
  }

  const data: { productName?: string; qty?: number; status?: OrderStatus; updatedAt: Date } = {
    updatedAt: new Date(),
  }
  if (productName != null) data.productName = productName
  if (qty != null) data.qty = qty
  if (status != null) data.status = status

  const existing = await prisma.order.findUnique({ where: { id, isDeleted: false } })
  if (!existing) return err("Order not found", 404)

  const order = await prisma.order.update({ where: { id }, data })
  return ok(order)
}

export async function DELETE(_: Request, context: Context) {
  const { id } = await context.params

  const existing = await prisma.order.findUnique({ where: { id, isDeleted: false } })
  if (!existing) return err("Order not found", 404)

  await prisma.order.update({ where: { id }, data: { isDeleted: true } })
  return ok({ deleted: true })
}
