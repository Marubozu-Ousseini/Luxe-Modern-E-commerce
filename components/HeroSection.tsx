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
      <section className="relative mb-10 overflow-hidden">
        <div className="relative h-[56vh] min-h-[420px] w-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-semibold tracking-tight leading-tight text-white">{title}</h1>
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
