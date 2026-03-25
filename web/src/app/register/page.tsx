"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { HeroImage } from "@/components/layout/HeroImage";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { normalizeCameroonPhone } from "@/lib/phone";
import { signUpEmailPassword, syncUserToServer } from "@/lib/firebaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextTown = town.trim();
    const nextPassword = password;
    const formattedPhone = normalizeCameroonPhone(phone.trim());

    if (!nextName) {
      setStatus("Nom requis.");
      return;
    }
    if (!nextEmail) {
      setStatus("Email requis.");
      return;
    }
    if (!formattedPhone) {
      setStatus("Téléphone invalide (ex: +237 6 99 99 99 99 ou 699999999). ");
      return;
    }
    if (!nextTown) {
      setStatus("Ville requise.");
      return;
    }
    if (!nextPassword.trim()) {
      setStatus("Mot de passe requis.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await signUpEmailPassword(nextEmail, nextPassword, nextName);
      try {
        localStorage.setItem("malafaareh_phone", formattedPhone);
        localStorage.setItem("malafaareh_town", nextTown);
      } catch {
        // ignore
      }
      await syncUserToServer(user, { name: nextName, phone: formattedPhone, town: nextTown });
      router.push("/shop");
    } catch (err: any) {
      setStatus(err?.message || "Inscription impossible.");
    } finally {
      setSubmitting(false);
    }
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

        <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
          {status ? <p className="rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm text-text-muted">{status}</p> : null}

          <label className="block text-sm text-text-primary">
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="mt-2 w-full rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              placeholder="Votre nom"
            />
          </label>

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

          <label className="block text-sm text-text-primary">
            Téléphone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => {
                const formatted = normalizeCameroonPhone(phone);
                if (formatted) setPhone(formatted);
              }}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              title="Exemples : +237 6 99 99 99 99 ou 699999999"
              className="mt-2 w-full rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              placeholder="+237 0 00 00 00 00"
            />
          </label>

          <label className="block text-sm text-text-primary">
            Ville
            <input
              value={town}
              onChange={(e) => setTown(e.target.value)}
              type="text"
              required
              className="mt-2 w-full rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              placeholder="Votre ville"
            />
          </label>

          <label className="block text-sm text-text-primary">
            Mot de passe
            <PasswordInput
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="Mot de passe"
              className="mt-2 w-full"
            />
          </label>

          <div className="mt-6">
            <Button type="submit" className="w-full" disabled={submitting}>
              Créer mon compte
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
