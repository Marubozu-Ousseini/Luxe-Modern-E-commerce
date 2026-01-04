type Kind = 'material' | 'color' | 'fit' | 'category';

const M: Record<string, string> = {
  cotton: 'Coton', silk: 'Soie', leather: 'Cuir', linen: 'Lin', wool: 'Laine',
  denim: 'Denim', cashmere: 'Cachemire', polyester: 'Polyester', viscose: 'Viscose'
};

const C: Record<string, string> = {
  black: 'Noir', white: 'Blanc', brown: 'Marron', beige: 'Beige', blue: 'Bleu',
  navy: 'Bleu marine', red: 'Rouge', green: 'Vert', olive: 'Olive', khaki: 'Kaki',
  gray: 'Gris', grey: 'Gris', charcoal: 'Anthracite', taupe: 'Taupe', sand: 'Sable',
  gold: 'Doré', silver: 'Argent', 
};

const F: Record<string, string> = {
  regular: 'Coupe classique', slim: 'Coupe ajustée', relaxed: 'Coupe ample',
  oversized: 'Oversize', tailored: 'Habillée'
};

const CAT: Record<string, string> = {
  'ready-to-wear': 'Prêt-à-porter',
  'ready_to_wear': 'Prêt-à-porter',
  'pret-a-porter': 'Prêt-à-porter',
  'pret_a_porter': 'Prêt-à-porter',
  'rtw': 'Prêt-à-porter',
  shoes: 'Chaussures',
  footwear: 'Chaussures',
  sneakers: 'Chaussures',
  perfumes: 'Parfums',
  fragrance: 'Parfums',
  fragrances: 'Parfums',
  watches: 'Montres',
  timepieces: 'Montres',
  accessories: 'Accessoires',
  accessory: 'Accessoires'
};

function norm(v?: string) { return (v || '').trim().toLowerCase(); }

export function translate(kind: Kind, value: string): string {
  const n = norm(value);
  if (!n) return value;
  if (kind === 'material') return M[n] || value;
  if (kind === 'color') return C[n] || value;
  if (kind === 'fit') return F[n] || value;
  if (kind === 'category') return CAT[n] || value;
  return value;
}

export function translateList(kind: Kind, values: (string|undefined|null)[]): string[] {
  return (values || []).filter(Boolean).map(v => translate(kind, String(v)));
}
