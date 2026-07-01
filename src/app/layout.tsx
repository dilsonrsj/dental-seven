import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Dental Seven",
  description: "Sistema para clínicas odontológicas — DR7 Performance",
  icons: {
    icon: "/brand/dental-seven-icon-on-dark-v2.png",
    apple: "/brand/dental-seven-icon-on-dark-v2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
