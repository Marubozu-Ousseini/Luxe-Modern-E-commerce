import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-porcelain px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-soft">
        <h2 className="text-3xl font-serif font-semibold tracking-tight mb-2">Bienvenue</h2>
        <p className="text-slate-600 mb-6">Accédez calmement à votre espace.</p>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" type="password" className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent" />
          <button className="w-full btn-primary py-2.5">Se connecter</button>
        </form>
        <p className="mt-4 text-sm text-gray-600">Pas encore de compte ? <Link to="/register" className="text-accent hover:opacity-90">Inscrivez-vous</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
