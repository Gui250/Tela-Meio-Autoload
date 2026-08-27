import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const redHatDisplay = localFont({
  src: "./fonts/red-hat-display/RedHatDisplay-Regular.ttf",
  variable: "--font-body",
  weight: "400",
});

const hando = localFont({
  src: [
    { path: "./fonts/hando/Hando-SemiBold.otf", weight: "600" },
    { path: "./fonts/hando/Hando-Bold.otf", weight: "700" },
  ],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "AutoMind — Painel Operacional",
  description: "Painel interativo do AutoMind com mapa da planta industrial",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${redHatDisplay.variable} ${hando.variable}`}>
      <body>{children}</body>
    </html>
  );
}
