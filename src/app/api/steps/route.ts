import { prisma } from "@/lib/db"
import { ok } from "@/lib/api-response"

export async function GET() {
  const steps = await prisma.step.findMany({ orderBy: { sequenceOrder: "asc" } })
  return ok(steps)
}
