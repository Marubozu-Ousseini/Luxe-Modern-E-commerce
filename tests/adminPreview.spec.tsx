// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import AdminPage from '../pages/Admin';
import * as AuthCtx from '../context/AuthContext';
import { PromotionsProvider } from '../context/PromotionsContext';
import { MemoryRouter } from 'react-router-dom';

// Provide a fake admin user by mocking useAuth (AuthContext exports useAuth hook)
vi.spyOn(AuthCtx, 'useAuth').mockImplementation(() => ({
  user: { id: '1', email: 'admin@example.com', role: 'admin' },
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
} as any));

function mockFetch() {
  vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/promotions/admin')) {
      return Promise.resolve(new Response(JSON.stringify({
        promotionsActive: true,
        vouchersActive: true,
        bannerText: 'Promo test',
        voucherText: 'Voucher test',
        loginBackground: { desktop: 'login-good.jpg', alt: 'Login Alt' },
        pageBackgrounds: {
          home: { desktop: 'home-good.jpg', alt: 'Home Alt' },
          showroom: { desktop: 'showroom.jpg', alt: 'Showroom Alt' },
          galeries: { desktop: 'galeries.jpg', alt: 'Galeries Alt' },
          story: { desktop: 'story.jpg', alt: 'Story Alt' },
          admin: { desktop: 'admin.jpg', alt: 'Admin Alt' },
        },
        stickers: [ { id: 'sticker-new', text: 'Nouveau' }, { id: 'sticker-offer', text: 'Offre' } ],
        glowEnabled: true,
        marqueeSpeedSeconds: 12,
        updatedAt: new Date().toISOString()
      }), { status: 200 }));
    }
    if (url.includes('/api/admin/produits') || url.includes('/api/admin/orders') || url.includes('/api/admin/users') || url.includes('/api/admin/payments')) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    if (url.includes('/api/promotions')) {
      return Promise.resolve(new Response(JSON.stringify({ promotionsActive: false, vouchersActive: false, bannerText: '', voucherText: '', updatedAt: new Date().toISOString() }), { status: 200 }));
    }
    return Promise.resolve(new Response('Not Found', { status: 404 }));
  });
}

describe('Admin promotions preview snapshot (DOM render)', () => {
  it('renders preview panel snapshot after clicking Prévisualiser', async () => {
    mockFetch();
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: any;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <MemoryRouter>
          <PromotionsProvider>
            <AdminPage />
          </PromotionsProvider>
        </MemoryRouter>
      );
      // wait for async loads
      await new Promise(r => setTimeout(r, 20));
    });

    // Simulate clicking Promotions tab by finding the button via text and triggering click
    const tabButtons = Array.from(container.querySelectorAll('button'));
    const promosBtn = tabButtons.find(b => /Promotions/i.test(b.textContent || '')) as HTMLButtonElement | undefined;
    expect(promosBtn).toBeDefined();

    await act(async () => {
      promosBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise(r => setTimeout(r, 20));
    });

    // Find Preview button and click
    const previewBtn = Array.from(container.querySelectorAll('button')).find(b => /Prévisualiser/i.test(b.textContent || '')) as HTMLButtonElement | undefined;
    expect(previewBtn).toBeDefined();
    await act(async () => { previewBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 20)); });

    // Locate preview region by heading text
    const previewHeading = Array.from(container.querySelectorAll('div')).find(d => /Aperçu fond de page/i.test(d.textContent || ''));
    expect(previewHeading).toBeDefined();

    // Snapshot the parent region
    const region = previewHeading!.closest('div')!.parentElement as HTMLElement;
    expect(region.innerHTML).toMatchSnapshot();

    root.unmount();
  });
});
