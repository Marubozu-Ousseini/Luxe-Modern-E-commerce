"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PromoOverlay } from "@/components/promotions/PromoOverlay";
import { DeliveryBanner } from "@/components/layout/DeliveryBanner";

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (hideChrome) return <>{children}</>;

  return (
    <>
      <PromoOverlay />
      <DeliveryBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-content px-6 md:px-8">{children}</main>
      <SiteFooter />
    </>
  );
}
