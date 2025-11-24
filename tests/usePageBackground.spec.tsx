// Test the usePageBackground hook without external testing libs.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { PromotionsProvider, usePageBackground } from '../context/PromotionsContext';

function mockPromotionsResponse(state: any) {
  vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo) => {
    if (typeof input === 'string' && input.includes('/api/promotions')) {
      return Promise.resolve(new Response(JSON.stringify(state), { status: 200 }));
    }
    return Promise.resolve(new Response('Not Found', { status: 404 }));
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  // simple matchMedia stub
  Object.defineProperty(window, 'matchMedia', { value: (q: string) => ({ matches: false, addListener: () => {}, removeListener: () => {} }) });
  // Mock Image: onload if filename contains 'good'
  // @ts-ignore
  global.Image = class {
    src = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor() {
      setTimeout(() => {
        if ((this as any).src && (this as any).src.includes('good')) this.onload && this.onload();
        else this.onerror && this.onerror();
      }, 0);
    }
  } as any;
});

describe('usePageBackground hook (DOM render)', () => {
  it('selects first successful candidate and exposes alt', async () => {
    mockPromotionsResponse({ pageBackgrounds: { home: { desktop: 'bad.jpg', fallback: ['bad2.jpg', 'really-good.jpg'], alt: 'Accueil' } } });

    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: any;

    const Probe: React.FC = () => {
      const res = usePageBackground('home');
      return <div id="probe">{JSON.stringify(res)}</div>;
    };

    root = createRoot(container);
    root.render(<PromotionsProvider><Probe /></PromotionsProvider>);
    // wait for effects and sequential image attempts to resolve
    await new Promise(r => setTimeout(r, 150));

    const content = container.querySelector('#probe')!.textContent || '';
    const parsed = JSON.parse(content);
    expect(parsed.src).toBe('really-good.jpg');
    expect(parsed.alt).toBe('Accueil');
    expect(parsed.loading).toBe(false);

    root.unmount();
  });

  it('finishes loading with no src when all fail', async () => {
    mockPromotionsResponse({ pageBackgrounds: { home: { desktop: 'bad-one.jpg', fallback: ['bad-two.jpg'], alt: 'X' } } });
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: any;
    const Probe: React.FC = () => {
      const res = usePageBackground('home');
      return <div id="probe">{JSON.stringify(res)}</div>;
    };
    root = createRoot(container);
    root.render(<PromotionsProvider><Probe /></PromotionsProvider>);
    await new Promise(r => setTimeout(r, 120));
    const parsed = JSON.parse(container.querySelector('#probe')!.textContent || '{}');
    expect(parsed.loading).toBe(false);
    expect(parsed.src).toBe(null);
    root.unmount();
  });
});
