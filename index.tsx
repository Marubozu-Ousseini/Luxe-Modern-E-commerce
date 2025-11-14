import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import App from './App.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Orders from './pages/Orders.tsx';
import Admin from './pages/Admin.tsx';
import Story from './pages/Story.tsx';
import Showroom from './pages/Showroom';
import Galeries from './pages/Galeries';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/story" element={<Story />} />
          <Route path="/showroom" element={<Showroom />} />
          <Route path="/galeries" element={<Galeries />} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);