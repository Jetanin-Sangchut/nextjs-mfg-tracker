import { prisma } from "@/lib/db"
import { LogsView } from "./components/LogsView"

export const instant = false

export default async function LogsPage() {
  const [stepLogs, resourceLogs] = await Promise.all([
    prisma.orderStepLog.findMany({
      include: {
        order: { select: { id: true, orderNumber: true, productName: true } },
        step: { select: { id: true, name: true, sequenceOrder: true } },
      },
      orderBy: [{ startedAt: "desc" }, { step: { sequenceOrder: "desc" } }],
    }),
    prisma.resourceConsumption.findMany({
      include: {
        resource: { select: { id: true, name: true, unit: true, type: true } },
        orderStepLog: {
          include: {
            order: { select: { id: true, orderNumber: true } },
            step: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <LogsView stepLogs={stepLogs} resourceLogs={resourceLogs} />
    </main>
  )
}
