import { redirect } from "next/navigation";
import { getClinicDetailForAdmin } from "@/lib/admin/actions";
import { getAuthContext } from "@/lib/auth/context";
import { ClinicDetail } from "@/modules/admin/clinic-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminClinicPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const detail = await getClinicDetailForAdmin(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <ClinicDetail {...detail} />
    </div>
  );
}
