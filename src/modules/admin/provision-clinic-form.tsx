"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAN_LABELS, type PlanKey } from "@/lib/billing/plans";
import { provisionClinicForAdmin } from "@/lib/admin/actions";

const PLAN_KEYS: PlanKey[] = ["essencial", "conecta", "inteligente", "completo"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function ProvisionClinicForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [planKey, setPlanKey] = useState<PlanKey>("conecta");
  const [trialDays, setTrialDays] = useState(7);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await provisionClinicForAdmin({
      name: name.trim(),
      slug: slug.trim(),
      planKey,
      trialDays,
      adminEmail: adminEmail.trim(),
      adminName: adminName.trim(),
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/admin/clinicas/${result.clinicId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm text-muted-foreground">
          Nome da clínica *
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm text-muted-foreground">
          Slug *
        </label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
          pattern="[a-z0-9-]+"
          title="Somente letras minúsculas, números e hífens"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="planKey" className="text-sm text-muted-foreground">
          Plano
        </label>
        <select
          id="planKey"
          value={planKey}
          onChange={(e) => setPlanKey(e.target.value as PlanKey)}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {PLAN_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="trialDays" className="text-sm text-muted-foreground">
          Dias de trial
        </label>
        <Input
          id="trialDays"
          type="number"
          min={1}
          max={90}
          value={trialDays}
          onChange={(e) => setTrialDays(Number(e.target.value))}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="adminName" className="text-sm text-muted-foreground">
          Nome do admin *
        </label>
        <Input
          id="adminName"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="adminEmail" className="text-sm text-muted-foreground">
          E-mail do admin *
        </label>
        <Input
          id="adminEmail"
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Um convite será enviado para definir a senha.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Criando…" : "Criar clínica e enviar convite"}
        </Button>
        <Link
          href="/admin/clinicas"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-surface"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
