import {
  Calendar,
  ClipboardList,
  MessageCircle,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  /** Rótulo curto para a barra inferior no mobile. */
  shortLabel?: string;
  icon: LucideIcon;
};

export const APP_NAV_LINKS: NavLink[] = [
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/procedimentos", label: "Procedimentos", shortLabel: "Proced.", icon: ClipboardList },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/financeiro", label: "Financeiro", shortLabel: "Financ.", icon: Wallet },
  { href: "/convenios", label: "Convênios", shortLabel: "Convên.", icon: ShieldCheck },
  { href: "/fornecedores", label: "Fornecedores", shortLabel: "Fornec.", icon: Truck },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/configuracoes", label: "Configurações", shortLabel: "Config.", icon: Settings },
];
