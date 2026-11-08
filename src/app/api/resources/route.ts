import { prisma } from "@/lib/db"
import { ok } from "@/lib/api-response"

export async function GET() {
  const resources = await prisma.resource.findMany({ orderBy: { name: "asc" } })
  return ok(resources)
}
