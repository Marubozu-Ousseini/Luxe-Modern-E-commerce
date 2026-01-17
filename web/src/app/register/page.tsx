"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { HeroImage } from "@/components/layout/HeroImage";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/account");
  }

  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">S’inscrire</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Créer votre compte</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
          Créez un compte pour activer vos avantages et retrouver vos commandes.
        </p>

        <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
          <div className="relative aspect-[21/9] bg-bg-subtle">
            <HeroImage pageKey="register" alt="Image héro – Inscription" title="Compte" subtitle="Créer votre compte" />
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 max-w-md">
          <label className="block text-sm text-text-primary">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-2 w-full rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              placeholder="vous@exemple.com"
            />
          </label>

          <div className="mt-6">
            <Button type="submit" className="w-full">
              Créer mon compte
            </Button>
          </div>

          <p className="mt-3 text-xs text-text-muted">
            Vous serez redirigé vers la page Compte pour saisir aussi votre téléphone et votre ville.
          </p>
        </form>
      </div>
    </div>
  );
}
