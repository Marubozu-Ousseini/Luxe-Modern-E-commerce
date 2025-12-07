import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordToggle from '../components/PasswordToggle';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
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
        </form>
        <p className="mt-4 text-sm text-gray-600">Pas encore de compte ? <Link to="/register" className="text-accent hover:opacity-90">Inscrivez-vous</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
