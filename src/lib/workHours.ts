export const HOURS_PER_DAY = 8;
export const HOURS_PER_WEEK = 40;
export const HOURS_PER_MONTH = 160;
export const SECONDARY_PROJECT_LIMIT = 0.5; // 50%

export const getMonthlySecondaryLimit = () => HOURS_PER_MONTH * SECONDARY_PROJECT_LIMIT;
export const getWeeklySecondaryLimit = () => HOURS_PER_WEEK * SECONDARY_PROJECT_LIMIT;

export function isWithinSecondaryLimit(
  existingHours: number,
  newHours: number,
  period: 'week' | 'month' = 'month'
): { valid: boolean; limit: number; available: number } {
  const limit = period === 'month' ? getMonthlySecondaryLimit() : getWeeklySecondaryLimit();
  const total = existingHours + newHours;
  return {
    valid: total <= limit,
    limit,
    available: limit - existingHours
  };
}

export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclure samedi et dimanche
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function calculateMaxHoursForPeriod(startDate: Date, endDate: Date): number {
  const workingDays = calculateWorkingDays(startDate, endDate);
  return workingDays * HOURS_PER_DAY;
}

export function isValidPeriodHours(
  startDate: Date,
  endDate: Date,
  hours: number,
  existingHours: number = 0
): { 
  valid: boolean; 
  maxHours: number; 
  availableHours: number;
  message: string;
} {
  const workingDays = calculateWorkingDays(startDate, endDate);
  const maxHours = calculateMaxHoursForPeriod(startDate, endDate);
  const maxSecondaryHours = maxHours * SECONDARY_PROJECT_LIMIT;
  const totalHours = existingHours + hours;

  return {
    valid: totalHours <= maxSecondaryHours,
    maxHours: maxSecondaryHours,
    availableHours: maxSecondaryHours - existingHours,
    message: `Pour cette période (${workingDays} jours ouvrés), vous pouvez saisir jusqu'à ${maxSecondaryHours}h sur des projets secondaires.`
  };
}

/**
 * Calcule le coût horaire basé sur le coût proforma annuel
 * @param annualProformaCost - Coût proforma annuel en USD
 * @returns Coût horaire en USD
 */
export function calculateHourlyCost(annualProformaCost: number): number {
  // Formule standardisée : Coût annuel / 2 (pour le semestre) / 480 (heures par semestre)
  const semesterCost = annualProformaCost / 2;
  const hourlyCost = semesterCost / 480;
  return Math.round(hourlyCost * 100) / 100; // Arrondir à 2 décimales
}

/**
 * Calcule le coût total d'une entrée de temps
 * @param hours - Nombre d'heures travaillées
 * @param annualProformaCost - Coût proforma annuel en USD
 * @returns Coût total en USD
 */
export function calculateEntryCost(hours: number, annualProformaCost: number): number {
  const hourlyCost = calculateHourlyCost(annualProformaCost);
  return Math.round(hours * hourlyCost * 100) / 100; // Arrondir à 2 décimales
}

/**
 * Calcule le coût total d'un projet
 * @param timeEntries - Entrées de temps avec heures et coûts proforma
 * @returns Coût total du projet en USD
 */
export function calculateProjectTotalCost(timeEntries: Array<{ hours: number; user: { proformaCosts: Array<{ cost: number }> } }>): number {
  let totalCost = 0;
  
  timeEntries.forEach(entry => {
    const proformaCost = entry.user.proformaCosts[0];
    if (proformaCost) {
      totalCost += calculateEntryCost(entry.hours, proformaCost.cost);
    }
  });
  
  return Math.round(totalCost * 100) / 100; // Arrondir à 2 décimales
}

// Constantes standardisées
export const HOURS_PER_SEMESTER = 480;
export const HOURS_PER_YEAR = 960; // 480 * 2
export const SEMESTERS_PER_YEAR = 2;
