import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { StepView } from "./components/StepView"

export const instant = false

type Props = {
  params: Promise<{ stepId: string }>
}

export default async function StepPage({ params }: Props) {
  const { stepId } = await params

  const step = await prisma.step.findUnique({ where: { id: stepId } })
  if (!step) notFound()

  const [orders, resources] = await Promise.all([
    prisma.order.findMany({
      where: { currentStepId: stepId, status: "IN_PROGRESS" },
      include: {
        currentStep: true,
        orderStepLogs: {
          where: { stepId, status: "IN_PROGRESS" },
          include: {
            resourceConsumptions: {
              include: { resource: true },
            },
          },
        },
      },
    }),
    prisma.resource.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <StepView step={step} orders={orders} resources={resources} />
    </main>
  )
}
