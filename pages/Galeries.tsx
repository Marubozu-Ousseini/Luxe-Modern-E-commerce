import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection.tsx';

const Galeries: React.FC = () => {
  return (
    <HeroSection
      pageKey="galeries"
      title="Galeries"
      description="Parcourez nos galeries d’images, campagnes et inspirations visuelles."
    >
      <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 pb-10 text-white">
        <Link to="/" className="btn-outline inline-flex items-center justify-center text-sm font-medium">
          Retour à l’accueil
        </Link>
      </div>
    </HeroSection>
  );
};

export default Galeries;
