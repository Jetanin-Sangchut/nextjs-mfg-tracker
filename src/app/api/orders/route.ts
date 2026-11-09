import { prisma } from "@/lib/db"
import { ok } from "@/lib/api-response"

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { currentStep: true },
    orderBy: { createdAt: "desc" },
  })
  return ok(orders)
}

