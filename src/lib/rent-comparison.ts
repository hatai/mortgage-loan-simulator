import type { RentComparison } from "./types";

/**
 * Calculate rent vs purchase comparison.
 *
 * @param monthlyRent - Current monthly rent in yen
 * @param annualIncreaseRate - Annual rent increase rate as percentage (e.g. 1 for 1%)
 * @param years - Number of years to compare over
 * @param purchaseTotal - Total purchase cost (downPayment + closingCosts + totalRepayment + maintenance)
 * @param taxDeductionTotal - Total housing loan tax deduction over the period
 * @returns RentComparison with rentTotal, purchaseTotal (net of tax deduction), difference, and breakEvenYear
 */
export function calculateRentComparison(
  monthlyRent: number,
  annualIncreaseRate: number,
  years: number,
  purchaseTotal: number,
  taxDeductionTotal: number,
): RentComparison {
  const purchaseGrandTotal = purchaseTotal - taxDeductionTotal;

  let rentTotal = 0;
  let currentMonthlyRent = monthlyRent;
  let breakEvenYear: number | undefined;

  for (let year = 1; year <= years; year++) {
    rentTotal += currentMonthlyRent * 12;
    currentMonthlyRent = currentMonthlyRent * (1 + annualIncreaseRate / 100);

    if (breakEvenYear === undefined && rentTotal >= purchaseGrandTotal) {
      breakEvenYear = year;
    }
  }

  const difference = rentTotal - purchaseGrandTotal;

  return {
    rentTotal: Math.round(rentTotal),
    purchaseTotal: purchaseGrandTotal,
    difference: Math.round(difference),
    breakEvenYear,
  };
}
