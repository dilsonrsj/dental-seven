import { redirect } from "next/navigation";
import { isBetaGateEnabled } from "@/lib/founding/gate";

export default function HomePage() {
  redirect(isBetaGateEnabled() ? "/founding" : "/entrar");
}
