/**
 * Utilitaires de formatage pour l'application
 */

/**
 * Formate un montant en USD sans utiliser toLocaleString pour éviter les problèmes d'affichage dans les PDFs
 * @param amount - Le montant à formater
 * @param showCurrency - Si true, ajoute "USD" à la fin (défaut: true)
 * @returns Le montant formaté
 */
export function formatAmount(amount: number, showCurrency: boolean = true): string {
  const roundedAmount = Math.round(amount);
  
  // Utiliser une approche simple pour éviter les problèmes de caractères spéciaux
  const formattedNumber = roundedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return showCurrency ? `${formattedNumber} USD` : formattedNumber;
}

/**
 * Formate un montant pour l'affichage dans l'interface utilisateur
 * Peut utiliser toLocaleString car l'affichage web gère mieux les caractères spéciaux
 * @param amount - Le montant à formater
 * @param locale - La locale à utiliser (défaut: 'fr-FR')
 * @param showCurrency - Si true, ajoute "USD" à la fin (défaut: true)
 * @returns Le montant formaté
 */
export function formatAmountForUI(amount: number, locale: string = 'fr-FR', showCurrency: boolean = true): string {
  const roundedAmount = Math.round(amount);
  const formattedNumber = roundedAmount.toLocaleString(locale);
  
  return showCurrency ? `${formattedNumber} USD` : formattedNumber;
}

/**
 * Formate un montant spécifiquement pour les PDFs
 * Utilise un formatage simple sans caractères spéciaux
 * @param amount - Le montant à formater
 * @param showCurrency - Si true, ajoute "USD" à la fin (défaut: true)
 * @returns Le montant formaté pour PDF
 */
export function formatAmountForPDF(amount: number, showCurrency: boolean = true): string {
  const roundedAmount = Math.round(amount);
  
  // Formatage simple avec des espaces pour les milliers
  const formattedNumber = roundedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return showCurrency ? `${formattedNumber} USD` : formattedNumber;
}

/**
 * Formate les heures
 * @param hours - Le nombre d'heures
 * @returns Les heures formatées avec "h"
 */
export function formatHours(hours: number): string {
  return `${hours}h`;
}

/**
 * Formate une date pour l'affichage
 * @param date - La date à formater
 * @param locale - La locale à utiliser (défaut: 'fr-FR')
 * @returns La date formatée
 */
export function formatDate(date: Date | string, locale: string = 'fr-FR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale);
}

/**
 * Formate une période (année + semestre)
 * @param year - L'année
 * @param semester - Le semestre
 * @returns La période formatée
 */
export function formatPeriod(year: number, semester: string): string {
  return `${year} - ${semester}`;
}

/**
 * Formate un pourcentage
 * @param value - La valeur à formater
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Le pourcentage formaté
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate un nom de fichier pour l'export
 * @param baseName - Le nom de base du fichier
 * @param year - L'année (optionnel)
 * @param semester - Le semestre (optionnel)
 * @param extension - L'extension du fichier (défaut: 'xlsx')
 * @returns Le nom de fichier formaté
 */
export function formatFileName(
  baseName: string, 
  year?: number, 
  semester?: string, 
  extension: string = 'xlsx'
): string {
  const date = new Date().toISOString().split('T')[0];
  const parts = [baseName];
  
  if (year) parts.push(year.toString());
  if (semester) parts.push(semester);
  parts.push(date);
  
  return `${parts.join('_')}.${extension}`;
}
