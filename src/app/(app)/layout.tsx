import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ToastProvider } from "@/components/ui/toast-provider";
import { DentistFilterProvider } from "@/contexts/dentist-filter-context";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DentistFilterProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
            <AppHeader />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
          <BottomNav />
        </div>
      </ToastProvider>
    </DentistFilterProvider>
  );
}
