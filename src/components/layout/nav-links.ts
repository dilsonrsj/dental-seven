import {
  Calendar,
  MessageCircle,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const APP_NAV_LINKS: NavLink[] = [
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
