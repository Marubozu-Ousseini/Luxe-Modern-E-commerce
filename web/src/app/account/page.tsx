"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { HeroImage } from "@/components/layout/HeroImage";
import { logoutEverywhere, notifyAuthChanged } from "@/lib/session";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { normalizeCameroonPhone } from "@/lib/phone";
import {
  changePasswordWithReauth,
  signInEmailPassword,
  signUpEmailPassword,
  subscribeToAuthState,
  syncUserToServer,
  updateDisplayName,
  getFirebaseAuth,
} from "@/lib/firebaseClient";

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupTown, setSignupTown] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>("");

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileTown, setProfileTown] = useState("");
  const [profileStatus, setProfileStatus] = useState<string>("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string>("");

  const isAuthed = useMemo(() => isLoggedIn && !!storedEmail, [isLoggedIn, storedEmail]);

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setIsLoggedIn(!!user);
      setStoredEmail(user?.email ?? null);
      setProfileEmail(user?.email ?? "");
      setProfileName(user?.displayName ?? "");
      notifyAuthChanged();
    });

    // Keep non-auth profile fields local-only for now.
    try {
      const phone = localStorage.getItem("malafaareh_phone") ?? "";
      const town = localStorage.getItem("malafaareh_town") ?? "";
      setProfilePhone(phone);
      setProfileTown(town);
    } catch {
      // ignore
    }

    return () => unsub();
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthStatus("");
    try {
      const user = await signInEmailPassword(loginEmail.trim(), loginPassword);
      await syncUserToServer(user);
      notifyAuthChanged();
      router.push("/shop");
    } catch (err: any) {
      setAuthStatus(err?.message || "Connexion impossible.");
    }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthStatus("");
    try {
      const formattedPhone = normalizeCameroonPhone(signupPhone.trim());
      if (!formattedPhone) {
        setAuthStatus("Téléphone invalide (ex: +237 6 99 99 99 99 ou 699999999). ");
        return;
      }
      if (!signupTown.trim()) {
        setAuthStatus("Ville requise.");
        return;
      }
      const user = await signUpEmailPassword(signupEmail.trim(), signupPassword, signupName.trim());
      try {
        localStorage.setItem("malafaareh_phone", formattedPhone);
        localStorage.setItem("malafaareh_town", signupTown.trim());
      } catch {
        // ignore
      }
      await syncUserToServer(user, { name: signupName.trim(), phone: formattedPhone, town: signupTown.trim() });
      notifyAuthChanged();
      router.push("/shop");
    } catch (err: any) {
      setAuthStatus(err?.message || "Inscription impossible.");
    }
  }

  function onLogout() {
    void logoutEverywhere();
    setIsLoggedIn(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("");

    const nextName = profileName.trim();
    const nextTown = profileTown.trim();
    const nextPhone = profilePhone.trim();
    if (!nextName) {
      setProfileStatus("Nom requis.");
      return;
    }
    if (!nextTown) {
      setProfileStatus("Ville requise.");
      return;
    }
    const formattedPhone = normalizeCameroonPhone(nextPhone);
    if (!formattedPhone) {
      setProfileStatus("Téléphone invalide (ex: +237 6 99 99 99 99 ou 699999999).");
      return;
    }

    try {
      await updateDisplayName(nextName);
      localStorage.setItem("malafaareh_phone", formattedPhone);
      localStorage.setItem("malafaareh_town", nextTown);

      try {
        const auth = await getFirebaseAuth();
        const user = auth.currentUser;
        if (user) {
          try {
            const idToken = await user.getIdToken();
            await fetch("/api/auth/me", {
              method: "PATCH",
              headers: {
                accept: "application/json",
                "content-type": "application/json",
                authorization: `Bearer ${idToken}`,
              },
              credentials: "include",
              body: JSON.stringify({ name: nextName, phone: formattedPhone, town: nextTown }),
            });
          } catch {
            // Non-bloquant
          }
          await syncUserToServer(user, { name: nextName, phone: formattedPhone, town: nextTown });
        }
      } catch {
        // Non-bloquant: les infos restent enregistrées localement.
      }
      setProfileStatus("Modifications enregistrées.");
    } catch {
      setProfileStatus("Impossible d’enregistrer sur cet appareil.");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus("");

    if (!newPassword.trim()) {
      setPasswordStatus("Nouveau mot de passe requis.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await changePasswordWithReauth(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus("Mot de passe mis à jour.");
    } catch (err: any) {
      setPasswordStatus(err?.message || "Impossible de modifier le mot de passe.");
    }
  }

  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Compte</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Connexion & inscription</h1>

        <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
          <div className="relative aspect-[21/9] bg-bg-subtle">
            <HeroImage pageKey="account" alt="Image héro – Compte" title="Compte" subtitle="Connexion & inscription" />
          </div>
        </div>

        {isAuthed ? (
          <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-card border border-border-soft bg-bg-subtle p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Mon compte</p>
              <h2 className="mt-3 font-serif text-2xl tracking-tight-luxe-sm">Informations</h2>
              <p className="mt-2 text-sm text-text-muted">
                Connecté en tant que <span className="font-medium text-text-primary">{storedEmail}</span>
              </p>

              <form onSubmit={saveProfile} className="mt-6 space-y-4">
                <label className="block text-sm text-text-primary">
                  Nom
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    type="text"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="Votre nom"
                  />
                </label>

                <label className="block text-sm text-text-primary">
                  Email
                  <input
                    value={profileEmail}
                    type="email"
                    autoComplete="email"
                    readOnly
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="vous@exemple.com"
                  />
                </label>

                <label className="block text-sm text-text-primary">
                  Téléphone
                  <input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    onBlur={() => {
                      const formatted = normalizeCameroonPhone(profilePhone);
                      if (formatted) setProfilePhone(formatted);
                    }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    title="Exemples : +237 6 99 99 99 99 ou 699999999"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="+237 0 00 00 00 00"
                  />
                </label>

                <label className="block text-sm text-text-primary">
                  Ville
                  <input
                    value={profileTown}
                    onChange={(e) => setProfileTown(e.target.value)}
                    type="text"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="Votre ville"
                  />
                </label>

                <div className="pt-1">
                  <Button type="submit" className="w-full">
                    Enregistrer
                  </Button>
                  {profileStatus ? <p className="mt-2 text-xs text-text-muted">{profileStatus}</p> : null}
                </div>
              </form>

              <div className="mt-6 border-t border-border-soft pt-5">
                <Button type="button" variant="subtle" onClick={onLogout}>
                  Se déconnecter
                </Button>
              </div>
            </section>

            <section className="rounded-card border border-border-soft bg-bg-subtle p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Sécurité</p>
              <h2 className="mt-3 font-serif text-2xl tracking-tight-luxe-sm">Mot de passe</h2>
              <form onSubmit={changePassword} className="mt-6 space-y-4">
                <PasswordInput
                  label="Mot de passe actuel"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <PasswordInput
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                <PasswordInput
                  label="Confirmer"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                <div className="pt-1">
                  <Button type="submit" className="w-full">
                    Mettre à jour
                  </Button>
                  {passwordStatus ? <p className="mt-2 text-xs text-text-muted">{passwordStatus}</p> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {!isAuthed && (
          <div className="mt-8">
            {mode === "login" ? (
            <section className="max-w-xl rounded-card border border-border-soft bg-bg-subtle p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Se connecter</p>
              <h2 className="mt-3 font-serif text-2xl tracking-tight-luxe-sm">Accédez à votre compte</h2>
              <form onSubmit={onLogin} className="mt-6">
                <label className="block text-sm text-text-primary">
                  Email
                  <input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="vous@exemple.com"
                  />
                </label>

                <label className="mt-4 block text-sm text-text-primary">
                  Mot de passe
                  <PasswordInput
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </label>

                <div className="mt-6">
                  <Button type="submit" className="w-full">
                    Se connecter
                  </Button>
                </div>
                {authStatus ? <p className="mt-3 text-xs text-text-muted">{authStatus}</p> : null}
              </form>

              <div className="mt-6 border-t border-border-soft pt-5">
                <p className="text-sm text-text-muted">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-text-primary underline underline-offset-4"
                  >
                    S’inscrire
                  </button>
                </p>
              </div>
            </section>
          ) : (
            <section className="max-w-xl rounded-card border border-border-soft bg-bg-subtle p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">S’inscrire</p>
              <h2 className="mt-3 font-serif text-2xl tracking-tight-luxe-sm">Créer un compte</h2>
              <form onSubmit={onSignup} className="mt-6">
                <label className="block text-sm text-text-primary">
                  Nom
                  <input
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    type="text"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="Votre nom"
                  />
                </label>

                <label className="mt-4 block text-sm text-text-primary">
                  Email
                  <input
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="vous@exemple.com"
                  />
                </label>

                <label className="mt-4 block text-sm text-text-primary">
                  Téléphone
                  <input
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    onBlur={() => {
                      const formatted = normalizeCameroonPhone(signupPhone);
                      if (formatted) setSignupPhone(formatted);
                    }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    title="Exemples : +237 6 99 99 99 99 ou 699999999"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="+237 0 00 00 00 00"
                  />
                </label>

                <label className="mt-4 block text-sm text-text-primary">
                  Ville
                  <input
                    value={signupTown}
                    onChange={(e) => setSignupTown(e.target.value)}
                    type="text"
                    required
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="Votre ville"
                  />
                </label>

                <label className="mt-4 block text-sm text-text-primary">
                  Mot de passe
                  <PasswordInput
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </label>

                <div className="mt-6">
                  <Button type="submit" className="w-full">
                    Créer mon compte
                  </Button>
                </div>
                {authStatus ? <p className="mt-3 text-xs text-text-muted">{authStatus}</p> : null}
              </form>

              <div className="mt-6 border-t border-border-soft pt-5">
                <p className="text-sm text-text-muted">
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-text-primary underline underline-offset-4"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </section>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
