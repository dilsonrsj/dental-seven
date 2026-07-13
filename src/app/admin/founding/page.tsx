import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listBetaFeedbackForAdmin,
  listFoundersForAdmin,
} from "@/lib/admin/actions";
import { getAuthContext } from "@/lib/auth/context";
import { FoundingList } from "@/modules/admin/founding-list";
import { BetaFeedbackList } from "@/modules/admin/beta-feedback-list";

export default async function AdminFoundingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const [founders, feedbacks] = await Promise.all([
    listFoundersForAdmin(),
    listBetaFeedbackForAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← SuperAdmin
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Founding Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline da beta fechada — formulário, cadastro, adoção e indicações
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Founders</h2>
        <FoundingList founders={founders} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Feedbacks recebidos
          </h2>
          <p className="text-sm text-muted-foreground">
            Formulário in-app `/feedback` — NPS e comentários dos testadores
          </p>
        </div>
        <BetaFeedbackList rows={feedbacks} />
      </section>
    </div>
  );
}
