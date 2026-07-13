"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, toast } from "@/components/ui";
import type { ClinicLogoSettings } from "./clinic-logo-actions";
import {
  removeClinicLogo,
  uploadClinicLogo,
} from "./clinic-logo-actions";

type ClinicLogoFormProps = {
  initial: ClinicLogoSettings;
  canWrite: boolean;
};

export function ClinicLogoForm({ initial, canWrite }: ClinicLogoFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState(initial);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !canWrite) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const updated = await uploadClinicLogo(formData);
      setSettings(updated);
      toast.success("Logo da clínica atualizada.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleRemove() {
    if (!canWrite || !settings.logo_storage_path) return;

    try {
      setIsRemoving(true);
      const updated = await removeClinicLogo();
      setSettings(updated);
      toast.success("Logo removida.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Aparece no topo do app e nos PDFs clínicos. PNG ou JPG, até 2 MB.
      </p>

      {settings.logo_preview_url ? (
        <div className="flex h-20 w-full max-w-xs items-center justify-center rounded-xl border border-border bg-background p-3">
          <Image
            src={settings.logo_preview_url}
            alt="Logo da clínica"
            width={200}
            height={64}
            unoptimized
            className="max-h-14 w-auto object-contain"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma logo enviada ainda.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            disabled={!canWrite || isUploading || isRemoving}
            onChange={(event) => void handleFileChange(event)}
          />
          <Button
            type="button"
            disabled={!canWrite || isUploading || isRemoving}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? "Enviando…" : "Enviar logo"}
          </Button>
        </label>

        {settings.logo_storage_path && (
          <Button
            type="button"
            variant="outline"
            disabled={!canWrite || isUploading || isRemoving}
            onClick={() => void handleRemove()}
          >
            {isRemoving ? "Removendo…" : "Remover logo"}
          </Button>
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível atualizar a logo.";
}
