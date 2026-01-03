import React from 'react';

const PromoRibbon: React.FC<{ text?: string }>= ({ text = 'Livraison offerte dès 100 000 FCFA' }) => {
  return (
    <div className="pointer-events-none select-none">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        <div className="relative mt-2 mb-4">
          <div className="rounded-full bg-[#0078FF]/10 text-[#0078FF] border border-[#0078FF]/25 px-4 py-2 text-sm inline-flex items-center gap-2 backdrop-blur-sm shadow-soft">
            <span className="inline-block h-2 w-2 rounded-full bg-[#0078FF] animate-pulse" />
            <span>{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoRibbon;
