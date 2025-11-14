/**
 * Formate un nombre en chaîne de caractères représentant la devise Franc CFA (XAF).
 * Utilise un espace comme séparateur de milliers et ajoute "FCFA" comme suffixe.
 * @param {number} value - La valeur numérique à formater.
 * @returns {string} La chaîne de caractères formatée.
 * @example
 * formatCurrency(25000) // "25 000 FCFA"
 * formatCurrency(1500.50) // "1 501 FCFA" (arrondi)
 */
export const formatCurrency = (value: number): string => {
  // Arrondit à l'entier le plus proche car les centimes sont rares en XAF
  const roundedValue = Math.round(value);

  // Utilise l'API Intl.NumberFormat pour un formatage robuste
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    useGrouping: true, 
  });
  
  // Remplace le séparateur de milliers standard (espace insécable) par un espace simple
  const formattedNumber = formatter.format(roundedValue).replace(/\s/g, ' ');

  return `${formattedNumber} FCFA`;
};
