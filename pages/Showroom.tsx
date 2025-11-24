import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection.tsx';

const Showroom: React.FC = () => {
  return (
    <HeroSection
      pageKey="showroom"
      title="Showroom"
      description="Découvrez nos espaces, matières et savoir-faire à travers une sélection soignée."
    >
      <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 pb-10 text-white">
        <Link to="/" className="btn-outline inline-flex items-center justify-center text-sm font-medium">
          Retour à l’accueil
        </Link>
      </div>
    </HeroSection>
  );
};

export default Showroom;
