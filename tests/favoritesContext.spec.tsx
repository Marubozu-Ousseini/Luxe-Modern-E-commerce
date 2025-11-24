import { describe, it, expect } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import ReactDOM from 'react-dom/client';
import { FavoritesProvider, useFavorites } from '../context/FavoritesContext.tsx';
import { AuthProvider } from '../context/AuthContext.tsx';

// Simple test component to exercise favorites
const Probe: React.FC<{ id: number }> = ({ id }) => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  return (
    <div>
      <span data-testid="count">{favorites.length}</span>
      <span data-testid="is">{isFavorite(id) ? 'yes' : 'no'}</span>
      <button data-testid="toggle" onClick={() => toggleFavorite(id)}>toggle</button>
    </div>
  );
};

describe('FavoritesContext (local only)', () => {
  it('toggles favorites state optimistically', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      const root = ReactDOM.createRoot(container);
      root.render(
        <AuthProvider>
          <FavoritesProvider>
            <Probe id={42} />
          </FavoritesProvider>
        </AuthProvider>
      );
    });
    const count = () => container.querySelector('[data-testid="count"]')!.textContent;
    const is = () => container.querySelector('[data-testid="is"]')!.textContent;
    const btn = container.querySelector('[data-testid="toggle"]') as HTMLButtonElement;
    expect(count()).toBe('0');
    expect(is()).toBe('no');
    act(() => { btn.click(); });
    expect(count()).toBe('1');
    expect(is()).toBe('yes');
    act(() => { btn.click(); });
    expect(count()).toBe('0');
    expect(is()).toBe('no');
  });
});
