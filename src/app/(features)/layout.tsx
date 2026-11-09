import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppBreadcrumb } from "@/components/app-breadcrumb"

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <AppBreadcrumb />
        </header>
        <main className="flex-1 p-6">{children}</main>
        <footer className="border-t px-6 py-3 text-xs text-muted-foreground">
          v0.1.0 · © 2026 Manufacturing Tracker
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
