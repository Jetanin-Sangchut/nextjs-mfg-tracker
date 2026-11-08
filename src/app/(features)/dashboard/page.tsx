import { prisma } from "@/lib/db"
import { DashboardView } from "./components/DashboardView"

export default async function DashboardPage() {
  const orders = await prisma.order.findMany({
    include: { currentStep: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of all manufacturing orders
        </p>
      </div>
      <DashboardView orders={orders} />
    </main>
  )
}
