import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memória de Reuniões — Ambiente institucional",
  description: "Registre reuniões, decisões e encaminhamentos da sua unidade.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
