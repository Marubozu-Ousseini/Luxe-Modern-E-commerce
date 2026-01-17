import React from 'react';
import PageBackground from './PageBackground.tsx';

interface HeroSectionProps {
  pageKey: 'showroom' | 'galeries';
  title: string;
  description: string;
  children?: React.ReactNode;
}

const HeroSection: React.FC<HeroSectionProps> = ({ pageKey, title, description, children }) => {
  return (
    <PageBackground pageKey={pageKey} overlayClassName="bg-black/30">
      <section className="bg-porcelain text-center py-20">
        <div className="container mx-auto">
          <h1 className="text-4xl font-serif font-semibold text-charcoal mb-6">{title}</h1>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600">Explorer la Collection</button>
            <button className="bg-white text-blue-500 px-6 py-3 rounded-md border border-blue-500 hover:bg-blue-100">Entrer dans l'Atelier</button>
          </div>
        </div>
      </section>
      <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 pb-10 text-white">
        <p className="text-white/90 mb-4 max-w-2xl">{description}</p>
        {children}
      </div>
    </PageBackground>
  );
};

export default HeroSection;
