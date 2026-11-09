"use client"

import { usePathname } from "next/navigation"

export function AppBreadcrumb() {
  const pathname = usePathname()
  const segment = pathname.split("/").filter(Boolean)[0] ?? ""
  const label = segment.charAt(0).toUpperCase() + segment.slice(1)
  return <span className="text-sm font-medium text-muted-foreground">{label}</span>
}
