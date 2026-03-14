import type { MonthlyScheduleItem, RepaymentMethod } from "./types";

/**
 * Calculate equal monthly payment (元利均等返済) using standard PMT formula.
 * @param principal - Loan principal in yen
 * @param annualRate - Annual interest rate as percentage (e.g. 1.5 for 1.5%)
 * @param years - Loan term in years
 * @returns Monthly payment amount in yen
 */
export function calculateEqualPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  if (monthlyRate === 0) {
    return principal / totalMonths;
  }

  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return Math.round(payment);
}

/**
 * Generate a full amortization schedule month by month.
 * @param principal - Loan principal in yen
 * @param annualRate - Annual interest rate as percentage (e.g. 1.5 for 1.5%)
 * @param years - Loan term in years
 * @param method - Repayment method (only 'equal_payment' supported currently)
 * @returns Array of MonthlyScheduleItem for each month
 */
export function generateSchedule(
  principal: number,
  annualRate: number,
  years: number,
  method: RepaymentMethod,
): MonthlyScheduleItem[] {
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  const schedule: MonthlyScheduleItem[] = [];

  if (method === "equal_payment") {
    const monthlyPayment = calculateEqualPayment(principal, annualRate, years);
    let balance = principal;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = Math.round(balance * monthlyRate);
      let principalPayment = monthlyPayment - interestPayment;

      // On last month, pay off any remaining balance to avoid rounding drift
      if (month === totalMonths) {
        principalPayment = balance;
      }

      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        principal: principalPayment,
        interest: interestPayment,
        balance,
        payment: principalPayment + interestPayment,
      });
    }
  } else {
    // equal_principal (元金均等返済)
    const monthlyPrincipal = Math.round(principal / totalMonths);
    let balance = principal;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = Math.round(balance * monthlyRate);
      const principalPayment = month === totalMonths ? balance : monthlyPrincipal;
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        principal: principalPayment,
        interest: interestPayment,
        balance,
        payment: principalPayment + interestPayment,
      });
    }
  }

  return schedule;
}
