import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || "Erreur d'inscription");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Inscription</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom" className="w-full px-3 py-2 border rounded" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" type="password" className="w-full px-3 py-2 border rounded" />
          <button className="w-full btn-primary py-2.5">Créer un compte</button>
        </form>
  <p className="mt-4 text-sm text-gray-600">Déjà un compte ? <Link to="/login" className="text-accent hover:opacity-90">Connectez-vous</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;
