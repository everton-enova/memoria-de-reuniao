import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memória — Suas reuniões organizadas",
  description: "Registre decisões, tarefas e aprendizados de cada reunião.",
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
