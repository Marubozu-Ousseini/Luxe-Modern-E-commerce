import React from 'react';
import { usePromotions } from '../context/PromotionsContext.tsx';

const AdBanner: React.FC = () => {
  const { promotions } = usePromotions();
  const single = promotions?.adBanner;
  const list = promotions?.adBanners || [];
  const activeList = list.filter(b => b.active);
  if ((!single || !single.active) && activeList.length === 0) return null;
  const item = (text: string, link?: string) => {
    const inner = (
      <div className="rounded-md bg-[#0078FF]/8 text-[#0A3D62] border border-[#0078FF]/20 px-4 py-3 text-sm flex items-center gap-3 backdrop-blur-sm shadow-soft">
        <span className="inline-block h-2 w-2 rounded-full bg-[#0078FF] animate-pulse" />
        <span className="truncate">{text}</span>
      </div>
    );
    return link ? (
      <a href={link} target="_blank" rel="noreferrer noopener" className="block hover:opacity-90">
        {inner}
      </a>
    ) : (
      inner
    );
  };
  return (
    <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8 mt-3 mb-5 space-y-2">
      {single?.active && item(single.text, single.link)}
      {activeList.map(b => (
        <div key={b.id}>{item(b.text, b.link)}</div>
      ))}
    </div>
  );
};

export default AdBanner;
