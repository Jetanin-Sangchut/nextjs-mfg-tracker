import { prisma } from "@/lib/db"
import { OrdersView } from "./components/OrdersView"

export const instant = false

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: { currentStep: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <OrdersView orders={orders} />
    </main>
  )
}
