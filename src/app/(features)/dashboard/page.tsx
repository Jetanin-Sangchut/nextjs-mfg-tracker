import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { DashboardView } from "./components/DashboardView"

async function DashboardContent() {
  const orders = await prisma.order.findMany({
    include: { currentStep: true },
    orderBy: { createdAt: "desc" },
  })
  return <DashboardView orders={orders} />
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of all manufacturing orders
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-400">Loading orders…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  )
}
