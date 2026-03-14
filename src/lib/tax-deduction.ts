import type { EnergyPerformance, PropertyType, TaxDeduction } from "./types";
import { generateSchedule } from "./loan-calculator";

/** Deduction rate for 2026 tax reform (令和8年度): 0.7% */
const DEDUCTION_RATE = 0.007;

/** Deduction period in years: 13 years */
const DEDUCTION_YEARS = 13;

/**
 * Returns the borrowing limit (借入限度額) in yen based on property type,
 * energy performance classification, and household type.
 *
 * Based on 2026 tax reform data (令和8年度).
 *
 * @param propertyType - 'new' (新築) or 'used' (中古)
 * @param energyPerformance - Energy performance classification
 * @param isChildRearing - Whether the household is a child-rearing household (子育て世帯)
 * @returns Borrowing limit in yen (0 means not eligible)
 */
export function getBorrowingLimit(
  propertyType: PropertyType,
  energyPerformance: EnergyPerformance,
  isChildRearing: boolean,
): number {
  if (propertyType === "new") {
    switch (energyPerformance) {
      case "certified":
        return isChildRearing ? 50_000_000 : 45_000_000;
      case "zeh":
        return isChildRearing ? 45_000_000 : 35_000_000;
      case "energy_standard":
        return isChildRearing ? 30_000_000 : 20_000_000;
      case "other":
        return 0;
    }
  } else {
    // used housing (中古住宅)
    switch (energyPerformance) {
      case "certified":
      case "zeh":
        return isChildRearing ? 45_000_000 : 35_000_000;
      case "energy_standard":
        return isChildRearing ? 30_000_000 : 20_000_000;
      case "other":
        return 20_000_000;
    }
  }
}

/**
 * Calculate the housing loan tax deduction (住宅ローン控除) for the full deduction period.
 *
 * Formula: yearly_deduction = floor(min(year_end_balance, borrowing_limit) × 0.007)
 *
 * @param principal - Loan principal in yen
 * @param annualRate - Annual interest rate as percentage (e.g. 1.5 for 1.5%)
 * @param years - Loan term in years
 * @param propertyType - 'new' (新築) or 'used' (中古)
 * @param energyPerformance - Energy performance classification
 * @param isChildRearing - Whether the household is a child-rearing household (子育て世帯)
 * @returns TaxDeduction object with yearly deductions and totals
 */
export function calculateTaxDeduction(
  principal: number,
  annualRate: number,
  years: number,
  propertyType: PropertyType,
  energyPerformance: EnergyPerformance,
  isChildRearing: boolean,
): TaxDeduction {
  const borrowingLimit = getBorrowingLimit(propertyType, energyPerformance, isChildRearing);

  // Not eligible for deduction
  if (borrowingLimit === 0) {
    return {
      borrowingLimit: 0,
      yearlyDeductions: [],
      totalDeduction: 0,
      effectiveTotalRepayment: principal, // no benefit; approximation without full schedule
    };
  }

  const monthlySchedule = generateSchedule(principal, annualRate, years, "equal_payment");

  // Build year-end balance lookup: year -> balance at end of that year
  const yearEndBalances = new Map<number, number>();
  for (let year = 1; year <= years; year++) {
    const decemberMonth = year * 12;
    const item = monthlySchedule[decemberMonth - 1];
    yearEndBalances.set(year, item ? item.balance : 0);
  }

  // Calculate total repayment for effectiveTotalRepayment
  const totalRepayment = monthlySchedule.reduce((sum, item) => sum + item.payment, 0);

  // Calculate yearly deductions for 13-year period
  const yearlyDeductions: { year: number; amount: number; balance: number }[] = [];

  for (let year = 1; year <= DEDUCTION_YEARS; year++) {
    const yearEndBalance = yearEndBalances.get(year) ?? 0;
    const effectiveBalance = Math.min(yearEndBalance, borrowingLimit);
    const deductionAmount = Math.floor(effectiveBalance * DEDUCTION_RATE);

    yearlyDeductions.push({
      year,
      amount: deductionAmount,
      balance: yearEndBalance,
    });
  }

  const totalDeduction = yearlyDeductions.reduce((sum, d) => sum + d.amount, 0);
  const effectiveTotalRepayment = totalRepayment - totalDeduction;

  return {
    borrowingLimit,
    yearlyDeductions,
    totalDeduction,
    effectiveTotalRepayment,
  };
}
