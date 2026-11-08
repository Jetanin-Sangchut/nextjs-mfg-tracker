import { NextRequest } from "next/server"
import { OrderStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ok, err } from "@/lib/api-response"

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { currentStep: true },
    orderBy: { createdAt: "desc" },
  })
  return ok(orders)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { orderNumber, productName, qty } = body

  console.log("Creating order", body)
  if (!orderNumber) return err("orderNumber is required")
  if (!productName) return err("productName is required")
  if (qty == null) return err("qty is required")

  const existing = await prisma.order.findUnique({ where: { orderNumber } })
  if (existing) return err("Order number already exists", 409)

  const order = await prisma.order.create({
    data: { orderNumber, productName, qty, status: OrderStatus.PENDING },
  })
  console.log("order", order)
  return ok(order, 201)
}
