import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentIdToken } from '../services/firebaseClient';
import PasswordToggle from '../components/PasswordToggle';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion');
    }
  };

  // Dynamic background retrieval from promotions endpoint for configurability
  const [bgSources, setBgSources] = useState<string[]>([]);
  const [desktopSrc, setDesktopSrc] = useState<string | undefined>(undefined);
  const [mobileSrc, setMobileSrc] = useState<string | undefined>(undefined);
  const [activeSrc, setActiveSrc] = useState<string>('');
  const [altText, setAltText] = useState<string>('Décor luxueux');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/promotions');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        const loginBg = json.loginBackground || {};
        setDesktopSrc(loginBg.desktop);
        setMobileSrc(loginBg.mobile);
        setBgSources(Array.isArray(loginBg.fallback) ? loginBg.fallback : []);
        if (loginBg.alt) setAltText(String(loginBg.alt));
      } catch {/* ignore */}
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Determine which image to use based on viewport width
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches, []);
  useEffect(() => {
    const candidateOrder = [
      isMobile ? mobileSrc : desktopSrc,
      ...bgSources
    ].filter(Boolean) as string[];
    if (!candidateOrder.length) return;
    // Attempt to resolve first loadable image (simple sequential test)
    let cancelled = false;
    (async () => {
      for (const src of candidateOrder) {
        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = src;
          });
          if (!cancelled) { setActiveSrc(src); break; }
        } catch {/* try next */}
      }
    })();
    return () => { cancelled = true; };
  }, [desktopSrc, mobileSrc, bgSources, isMobile]);

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      {/* Background image layer (dynamic with skeleton) */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {activeSrc ? (
          <img
            src={activeSrc}
            alt={altText}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      </div>
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/40">
        <h2 className="text-3xl font-serif font-semibold tracking-tight mb-2">Bienvenue</h2>
        <p className="text-slate-600 mb-6">Accédez calmement à votre espace.</p>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent" />
          <PasswordToggle value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent" />
          <button className="w-full btn-primary py-2.5">Se connecter</button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="text-sm text-gray-500">ou</div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button type="button" onClick={async () => {
            try {
              if (!loginWithGoogle) throw new Error('Google sign-in non configuré');
              const fbUser = await loginWithGoogle();
              // Send a server-side verified log: include ID token and let server verify
              try {
                const idToken = await getCurrentIdToken();
                if (idToken) {
                  await fetch('/api/auth/log-google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken })
                  });
                }
              } catch (e) { /* non-fatal */ }
              navigate('/');
            } catch (err:any) {
              setError(err?.message || 'Google sign-in échoué');
            }
          }} className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2 text-sm hover:shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.7 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.9 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.9 29.6 3 24 3 16.5 3 9.9 7.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43c5.5 0 10.5-1.9 14.3-5.2l-6.8-5.6C29.7 33.9 27 35 24 35c-6 0-10.7-3.3-13-8.1l-6.6 5.1C8 36.9 15.5 43 24 43z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.2 3.6-3.9 6.6-7.3 8.4l0 0 6.8 5.6C39.9 39.1 48 31 48 23c0-1.3-.1-2.6-.4-3.5z"/></svg>
            Se connecter avec Google
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">Pas encore de compte ? <Link to="/register" className="text-accent hover:opacity-90">Inscrivez-vous</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
