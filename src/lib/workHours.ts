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
