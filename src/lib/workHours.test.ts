import { calculateHourlyCost, calculateEntryCost, calculateProjectTotalCost, HOURS_PER_SEMESTER, HOURS_PER_YEAR, SEMESTERS_PER_YEAR } from './workHours';

describe('Work Hours Calculations', () => {
  describe('calculateHourlyCost', () => {
    it('should calculate hourly cost correctly for annual proforma cost', () => {
      const annualCost = 96000; // 96,000 USD per year
      const expectedHourlyCost = (96000 / 2) / 480; // 100 USD per hour
      
      expect(calculateHourlyCost(annualCost)).toBe(expectedHourlyCost);
    });

    it('should handle zero annual cost', () => {
      expect(calculateHourlyCost(0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const annualCost = 50000;
      const result = calculateHourlyCost(annualCost);
      expect(result).toBe(52.08); // (50000 / 2) / 480 = 52.0833... rounded to 52.08
    });
  });

  describe('calculateEntryCost', () => {
    it('should calculate entry cost correctly', () => {
      const hours = 8;
      const annualCost = 96000;
      const expectedCost = 8 * ((96000 / 2) / 480); // 800 USD
      
      expect(calculateEntryCost(hours, annualCost)).toBe(expectedCost);
    });

    it('should handle zero hours', () => {
      expect(calculateEntryCost(0, 96000)).toBe(0);
    });
  });

  describe('calculateProjectTotalCost', () => {
    it('should calculate project total cost correctly', () => {
      const mockTimeEntries = [
        { hours: 8, user: { proformaCosts: [{ cost: 96000 }] } },
        { hours: 6, user: { proformaCosts: [{ cost: 72000 }] } },
        { hours: 4, user: { proformaCosts: [{ cost: 48000 }] } }
      ];

      const expectedCost = 8 * ((96000 / 2) / 480) + 6 * ((72000 / 2) / 480) + 4 * ((48000 / 2) / 480);
      
      expect(calculateProjectTotalCost(mockTimeEntries)).toBe(expectedCost);
    });

    it('should handle empty time entries', () => {
      expect(calculateProjectTotalCost([])).toBe(0);
    });
  });

  describe('Constants', () => {
    it('should have correct hours per semester', () => {
      expect(HOURS_PER_SEMESTER).toBe(480);
    });

    it('should have correct hours per year', () => {
      expect(HOURS_PER_YEAR).toBe(960);
    });

    it('should have correct semesters per year', () => {
      expect(SEMESTERS_PER_YEAR).toBe(2);
    });

    it('should maintain mathematical consistency', () => {
      expect(HOURS_PER_SEMESTER * SEMESTERS_PER_YEAR).toBe(HOURS_PER_YEAR);
    });
  });
});
