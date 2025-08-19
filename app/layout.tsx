import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../app/temaEscuro/themeProvider"; // caminho atualizado

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Credenciamento",
  description: "Sistema de login com tema escuro",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
return (
  <html lang="pt-BR" suppressHydrationWarning>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </body>
  </html>
);

}
