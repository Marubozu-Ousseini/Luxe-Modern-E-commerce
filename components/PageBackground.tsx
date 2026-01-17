import React from 'react';
import { usePageBackground } from '../context/PromotionsContext.tsx';

interface PageBackgroundProps {
  pageKey: string;
  overlayClassName?: string;
  children: React.ReactNode;
}

// Generic wrapper to apply a dynamic background image (cover) behind page content
const PageBackground: React.FC<PageBackgroundProps> = ({ pageKey, overlayClassName = 'bg-black/40 backdrop-blur-[2px]', children }) => {
  const { src, alt, loading } = usePageBackground(pageKey);
  const bgStyle: React.CSSProperties | undefined = src ? {
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat'
  } : undefined;

  return (
    <div className="relative min-h-screen bg-[#082a6a]">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {src ? (
          <div style={bgStyle} className="w-full h-full" role="img" aria-label={alt || ''} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        )}
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>
      {children}
    </div>
  );
};

export default PageBackground;
