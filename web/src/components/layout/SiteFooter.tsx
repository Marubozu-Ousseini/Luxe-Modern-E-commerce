"use client";

import {
  IconFacebook,
  IconInstagram,
  IconSnapchat,
  IconTikTok,
  IconWhatsapp,
} from "@/components/ui/Icons";
import { useEffect, useState } from "react";
import { cacheSiteSettings, fetchSiteSettingsFromServer, getCachedSiteSettings } from "@/lib/siteSettings";

export function SiteFooter() {
  const [brandName, setBrandName] = useState("Malafaareh");
  const [tagline, setTagline] = useState("Le luxe qui murmure, la beauté.... Une présence qui reste.");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const server = await fetchSiteSettingsFromServer();
      if (cancelled) return;
      if (server) {
        setBrandName(server.brandName);
        setTagline(server.tagline);
        cacheSiteSettings(server);
        return;
      }
      const cached = getCachedSiteSettings();
      if (cached) {
        setBrandName(cached.brandName);
        setTagline(cached.tagline);
      }
    })();

    function onStorage(e: StorageEvent) {
      if (e.key !== "malafaareh_site_settings") return;
      const cached = getCachedSiteSettings();
      if (cached) {
        setBrandName(cached.brandName);
        setTagline(cached.tagline);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <footer className="mt-12 border-t border-border-soft bg-footer-brown">
      <div className="mx-auto max-w-content px-6 py-8 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-serif text-lg tracking-tight-luxe-sm">{brandName}</p>
            <p className="mt-2 max-w-md text-sm text-text-muted">
              {tagline}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/malafaareh"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center justify-center rounded-card border border-border-soft bg-bg-surface p-2.5 text-social-instagram shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-social-instagram/40"
            >
              <IconInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com/malafaareh"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="inline-flex items-center justify-center rounded-card border border-border-soft bg-bg-surface p-2.5 text-social-facebook shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-social-facebook/40"
            >
              <IconFacebook className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="inline-flex items-center justify-center rounded-card border border-border-soft bg-bg-surface p-2.5 text-social-whatsapp shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-social-whatsapp/40"
            >
              <IconWhatsapp className="h-5 w-5" />
            </a>
            <a
              href="https://snapchat.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Snapchat"
              className="inline-flex items-center justify-center rounded-card border border-border-soft bg-social-snapchat p-2.5 text-text-primary shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-social-snapchat/40"
            >
              <IconSnapchat className="h-5 w-5" />
            </a>
            <a
              href="https://tiktok.com/@malafaareh"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="inline-flex items-center justify-center rounded-card border border-border-soft bg-bg-surface p-2.5 text-social-tiktok shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-social-tiktok/40"
            >
              <IconTikTok className="h-5 w-5" />
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-text-muted">© 2026 {brandName} by Sensei Marubozu</p>
      </div>
    </footer>
  );
}
