import { prisma } from "@/lib/db"
import { StepsView } from "./components/StepsView"

export default async function StepsPage() {
  const steps = await prisma.step.findMany({
    orderBy: { sequenceOrder: "asc" },
  })

  return <StepsView steps={steps} />
}
