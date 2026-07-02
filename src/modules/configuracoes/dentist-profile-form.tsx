"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Input, toast } from "@/components/ui";
import type { DentistProfile } from "./dentist-profile-actions";
import {
  updateDentistProfile,
  uploadDentistSignature,
} from "./dentist-profile-actions";

type DentistProfileFormProps = {
  initialProfile: DentistProfile;
  canWrite: boolean;
};

export function DentistProfileForm({
  initialProfile,
  canWrite,
}: DentistProfileFormProps) {
  const router = useRouter();
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [cro, setCro] = useState(initialProfile.cro ?? "");
  const [specialty, setSpecialty] = useState(initialProfile.specialty ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;

    try {
      setIsSavingProfile(true);
      const updated = await updateDentistProfile(profile.id, { cro, specialty });
      setProfile(updated);
      toast.success("Perfil profissional atualizado.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSignatureChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !canWrite) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploadingSignature(true);
      const updated = await uploadDentistSignature(profile.id, formData);
      setProfile(updated);
      toast.success("Assinatura enviada.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingSignature(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Dados usados em documentos clínicos gerados no prontuário.
        </p>
        <p className="mt-1 text-sm font-medium">{profile.name}</p>
      </div>

      <form onSubmit={(event) => void handleSaveProfile(event)} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">CRO</span>
          <Input
            value={cro}
            onChange={(event) => setCro(event.target.value)}
            placeholder="Ex.: CRO-SP 12345"
            disabled={!canWrite || isSavingProfile}
            maxLength={40}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Especialidade</span>
          <Input
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
            placeholder="Ex.: Ortodontia"
            disabled={!canWrite || isSavingProfile}
            maxLength={120}
          />
        </label>

        {!canWrite && (
          <p className="text-sm text-amber-400">
            Assinatura inativa — edição bloqueada até regularizar o plano.
          </p>
        )}

        <Button type="submit" disabled={!canWrite || isSavingProfile}>
          {isSavingProfile ? "Salvando..." : "Salvar perfil"}
        </Button>
      </form>

      <div className="space-y-3 border-t border-border pt-4">
        <div>
          <h3 className="text-sm font-semibold">Assinatura visual</h3>
          <p className="text-sm text-muted-foreground">
            PNG com fundo transparente, até 2 MB.
          </p>
        </div>

        {profile.signature_preview_url ? (
          <div className="rounded-xl border border-border bg-background p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.signature_preview_url}
              alt="Assinatura do dentista"
              className="max-h-24 max-w-full object-contain"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma assinatura enviada ainda.
          </p>
        )}

        <label className="inline-flex">
          <input
            ref={signatureInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            disabled={!canWrite || isUploadingSignature}
            onChange={(event) => void handleSignatureChange(event)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!canWrite || isUploadingSignature}
            onClick={() => signatureInputRef.current?.click()}
          >
            {isUploadingSignature ? "Enviando..." : "Enviar assinatura PNG"}
          </Button>
        </label>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível atualizar o perfil.";
}
