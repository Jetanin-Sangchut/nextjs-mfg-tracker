import { prisma } from "@/lib/db"
import { OrdersView } from "./components/OrdersView"

export const instant = false

export default async function OrdersPage() {
  const [orders, steps, resources] = await Promise.all([
    prisma.order.findMany({
      include: { currentStep: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.step.findMany({ orderBy: { sequenceOrder: "asc" } }),
    prisma.resource.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <OrdersView orders={orders} steps={steps} resources={resources} />
    </main>
  )
}
