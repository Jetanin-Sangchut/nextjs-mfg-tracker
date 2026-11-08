import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params
  const body = await request.json()
  const { qtyUsed } = body

  if (qtyUsed == null) return err("qtyUsed is required")
  if (qtyUsed <= 0) return err("qtyUsed must be > 0")

  const existing = await prisma.resourceConsumption.findUnique({ where: { id } })
  if (!existing) return err("Log not found", 404)

  const updated = await prisma.resourceConsumption.update({ where: { id }, data: { qtyUsed } })
  return ok(updated)
}

export async function DELETE(_: Request, context: Context) {
  const { id } = await context.params

  const existing = await prisma.resourceConsumption.findUnique({ where: { id } })
  if (!existing) return err("Log not found", 404)

  await prisma.resourceConsumption.delete({ where: { id } })
  return ok({ deleted: true })
}
