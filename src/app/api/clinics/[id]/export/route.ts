import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { buildClinicExport } from "@/lib/export/build-clinic-export";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return POST(_request, context);
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: clinicId } = await context.params;
  const ctx = await getAuthContext();

  if (!ctx) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const isOwnClinic = ctx.profile.clinic_id === clinicId;
  const isSuperAdmin = ctx.profile.role === "super_admin";

  if (!isOwnClinic && !isSuperAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { buffer, filename } = await buildClinicExport(clinicId);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao exportar dados";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
