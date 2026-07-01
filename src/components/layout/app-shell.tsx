import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PaywallOverlay } from "@/components/billing/paywall-overlay";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getAuthContext } from "@/lib/auth/context";
import { shouldShowPaywall } from "@/lib/billing/subscription";
import { ClinicSessionProvider } from "@/contexts/clinic-session-context";
import { DentistFilterProvider } from "@/contexts/dentist-filter-context";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");

  const showPaywall =
    ctx.clinic &&
    shouldShowPaywall(ctx.clinic.subscription_status, ctx.profile.role);

  return (
    <ClinicSessionProvider
      value={{
        profile: ctx.profile,
        clinic: ctx.clinic,
        enabledModules: ctx.enabledModules,
        dentists: ctx.dentists,
      }}
    >
      <DentistFilterProvider>
        <ToastProvider>
          <div className="relative flex min-h-screen bg-background">
            {showPaywall && ctx.clinic && (
              <PaywallOverlay
                clinicId={ctx.clinic.id}
                planKey={ctx.clinic.plan_key}
                status={
                  ctx.clinic.subscription_status === "past_due"
                    ? "past_due"
                    : "expired"
                }
              />
            )}
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
              <AppHeader />
              <main
                className={`flex-1 p-4 sm:p-6 ${showPaywall ? "pointer-events-none select-none opacity-40" : ""}`}
              >
                {children}
              </main>
            </div>
            <BottomNav />
          </div>
        </ToastProvider>
      </DentistFilterProvider>
    </ClinicSessionProvider>
  );
}
