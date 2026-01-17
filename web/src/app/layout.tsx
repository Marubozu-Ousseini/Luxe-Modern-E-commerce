import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Chrome } from "@/components/layout/Chrome";

export const metadata: Metadata = {
  title: "Malafaareh",
  description: "Une expérience e‑commerce curatée, calme et sûre.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-bg-subtle font-sans text-text-primary antialiased">
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
