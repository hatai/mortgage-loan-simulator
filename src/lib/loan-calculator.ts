import type { MonthlyScheduleItem, RepaymentMethod, VariableRateScenario, YearlyScheduleSummary } from "./types";

/**
 * Calculate equal monthly payment (元利均等返済) using standard PMT formula.
 * @param principal - Loan principal in yen
 * @param annualRate - Annual interest rate as percentage (e.g. 1.5 for 1.5%)
 * @param years - Loan term in years
 * @returns Monthly payment amount in yen (rounded integer)
 */
export function calculateEqualPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  if (monthlyRate === 0) {
    return Math.round(principal / totalMonths);
  }

  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return Math.round(payment);
}

/**
 * Calculate equal principal (元金均等返済) payment for a specific month.
 * The principal portion is fixed; interest decreases as balance reduces.
 * @param principal - Loan principal in yen
 * @param annualRate - Annual interest rate as percentage
 * @param years - Loan term in years
 * @param month - The month number (1-based)
 * @returns Payment amount for that month in yen (rounded integer)
 */
export function calculateEqualPrincipal(
  principal: number,
  annualRate: number,
  years: number,
  month: number,
): number {
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  const principalPortion = principal / totalMonths;
  // Remaining balance at start of this month
  const remainingBalance = principal - principalPortion * (month - 1);
  const interest = remainingBalance * monthlyRate;
  return Math.round(principalPortion + interest);
}

/**
 * Generate a full amortization schedule month by month.
 * @param principal - Loan principal in yen
 * @param annualRate - Annual interest rate as percentage (e.g. 1.5 for 1.5%)
 * @param years - Loan term in years
 * @param method - Repayment method: 'equal_payment' (元利均等) or 'equal_principal' (元金均等)
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
      let actualPayment = monthlyPayment;

      // On last month, pay off any remaining balance to avoid rounding drift
      if (month === totalMonths) {
        principalPayment = balance;
        actualPayment = balance + interestPayment;
      }

      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        principal: principalPayment,
        interest: interestPayment,
        balance,
        payment: actualPayment,
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

export interface BonusPaymentResult {
  monthlyPayment: number;
  bonusPayment: number;
  bonusPrincipal: number;
  monthlyPrincipal: number;
  schedule: MonthlyScheduleItem[];
}

/**
 * Calculate loan with bonus payment (ボーナス払い).
 * Bonus payments occur in June (month 6, 18, 30, ...) and December (month 12, 24, 36, ...).
 * Bonus principal portion is capped at 50% of total principal.
 * @param principal - Total loan principal in yen
 * @param annualRate - Annual interest rate as percentage
 * @param years - Loan term in years
 * @param bonusPaymentPerTime - Extra payment amount per bonus occasion in yen
 */
export function calculateWithBonus(
  principal: number,
  annualRate: number,
  years: number,
  bonusPaymentPerTime: number,
): BonusPaymentResult {
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  // Bonus occurs twice a year (June and December).
  // Treat bonus repayment as semi-annual: rate_semi = monthlyRate * 6, periods = years * 2
  const semiAnnualRate = monthlyRate * 6;
  const semiAnnualPeriods = years * 2;

  // Calculate PV of all bonus payments to determine how much principal is allocated to bonus
  let bonusPrincipal: number;
  if (semiAnnualRate === 0) {
    bonusPrincipal = bonusPaymentPerTime * semiAnnualPeriods;
  } else {
    // PV = PMT * (1 - (1+r)^-n) / r
    bonusPrincipal =
      (bonusPaymentPerTime * (1 - Math.pow(1 + semiAnnualRate, -semiAnnualPeriods))) / semiAnnualRate;
  }

  // Cap bonus portion at 50% of total principal
  bonusPrincipal = Math.min(bonusPrincipal, principal * 0.5);
  bonusPrincipal = Math.round(bonusPrincipal);

  const monthlyPrincipal = principal - bonusPrincipal;

  // Monthly PMT for the monthly portion
  const monthlyPayment = calculateEqualPayment(monthlyPrincipal, annualRate, years);

  // Semi-annual PMT for the bonus portion
  let bonusPayment: number;
  if (semiAnnualRate === 0) {
    bonusPayment = Math.round(bonusPrincipal / semiAnnualPeriods);
  } else {
    const factor = Math.pow(1 + semiAnnualRate, semiAnnualPeriods);
    bonusPayment = Math.round((bonusPrincipal * semiAnnualRate * factor) / (factor - 1));
  }

  // Generate combined schedule
  const schedule: MonthlyScheduleItem[] = [];
  let monthlyBalance = monthlyPrincipal;
  let bonusBalance = bonusPrincipal;
  let semiPeriodCount = 0; // count of bonus payments made

  for (let month = 1; month <= totalMonths; month++) {
    // Monthly portion
    const monthlyInterest = Math.round(monthlyBalance * monthlyRate);
    let monthlyPrincipalPortion: number;
    let actualMonthlyPayment: number;

    if (month === totalMonths) {
      monthlyPrincipalPortion = monthlyBalance;
      actualMonthlyPayment = monthlyBalance + monthlyInterest;
    } else {
      monthlyPrincipalPortion = Math.max(0, monthlyPayment - monthlyInterest);
      actualMonthlyPayment = monthlyPayment;
    }
    monthlyBalance = Math.max(0, monthlyBalance - monthlyPrincipalPortion);

    // Bonus portion - occurs in month 6 and 12 of each year cycle
    const monthInYear = month % 12; // 0 = December, 6 = June
    const isBonusMonth = monthInYear === 6 || monthInYear === 0;

    let bonusPrincipalPortion = 0;
    let bonusInterest = 0;
    let actualBonusPayment = 0;

    if (isBonusMonth && bonusBalance > 0) {
      semiPeriodCount++;
      const semiAnnualInterest = Math.round(bonusBalance * semiAnnualRate);
      const remainingSemiPeriods = semiAnnualPeriods - semiPeriodCount;

      if (remainingSemiPeriods <= 0) {
        // Final bonus payment
        bonusPrincipalPortion = bonusBalance;
        actualBonusPayment = bonusBalance + semiAnnualInterest;
      } else {
        bonusPrincipalPortion = Math.max(0, bonusPayment - semiAnnualInterest);
        actualBonusPayment = bonusPayment;
      }
      bonusInterest = semiAnnualInterest;
      bonusBalance = Math.max(0, bonusBalance - bonusPrincipalPortion);
    }

    schedule.push({
      month,
      principal: monthlyPrincipalPortion + bonusPrincipalPortion,
      interest: monthlyInterest + bonusInterest,
      balance: monthlyBalance + bonusBalance,
      payment: actualMonthlyPayment + actualBonusPayment,
    });
  }

  return {
    monthlyPayment,
    bonusPayment,
    bonusPrincipal,
    monthlyPrincipal,
    schedule,
  };
}

/**
 * Convert a monthly amortization schedule to yearly summaries.
 * @param schedule - Array of MonthlyScheduleItem
 * @returns Array of YearlyScheduleSummary, one per year
 */
export function scheduleToYearlySummary(schedule: MonthlyScheduleItem[]): YearlyScheduleSummary[] {
  const summaries: YearlyScheduleSummary[] = [];
  const totalMonths = schedule.length;
  const years = Math.ceil(totalMonths / 12);

  for (let year = 1; year <= years; year++) {
    const startIdx = (year - 1) * 12;
    const endIdx = Math.min(year * 12, totalMonths);
    const yearItems = schedule.slice(startIdx, endIdx);

    const totalPrincipal = yearItems.reduce((sum, item) => sum + item.principal, 0);
    const totalInterest = yearItems.reduce((sum, item) => sum + item.interest, 0);
    const endBalance = yearItems[yearItems.length - 1].balance;
    const totalPayment = yearItems.reduce((sum, item) => sum + item.payment, 0);
    const averagePayment = Math.round(totalPayment / yearItems.length);

    summaries.push({
      year,
      totalPrincipal,
      totalInterest,
      endBalance,
      averagePayment,
    });
  }

  return summaries;
}

export interface RateChange {
  afterYear: number;
  newRate: number;
}

/**
 * Calculate variable rate scenarios with 5-year rule and 125% rule.
 *
 * Default scenarios (when customRateIncreases is not provided):
 * - 楽観 (optimistic): rate stays same throughout
 * - 基準 (standard): +0.25% every 5 years
 * - 悲観 (pessimistic): +0.5% every 5 years
 *
 * 5-year rule (5年ルール): payment amount only recalculated every 5 years (60 months).
 * 125% rule (125%ルール): new payment cannot exceed 125% of previous period's payment.
 * If interest exceeds payment (negative amortization), unpaid interest is added to balance.
 *
 * @param principal - Loan principal in yen
 * @param initialRate - Initial annual interest rate as percentage
 * @param years - Loan term in years
 * @param customRateIncreases - Optional custom rate change schedule; returns single custom scenario
 * @returns Array of VariableRateScenario
 */
export function calculateVariableRateScenarios(
  principal: number,
  initialRate: number,
  years: number,
  customRateIncreases?: RateChange[],
): VariableRateScenario[] {
  if (customRateIncreases) {
    const scenario = runVariableRateScenario("カスタム", principal, initialRate, years, customRateIncreases);
    return [scenario];
  }

  // Build rate change schedules for each default scenario
  const optimisticChanges: RateChange[] = [];

  const standardChanges: RateChange[] = [];
  for (let y = 5; y < years; y += 5) {
    standardChanges.push({ afterYear: y, newRate: initialRate + 0.25 * (y / 5) });
  }

  const pessimisticChanges: RateChange[] = [];
  for (let y = 5; y < years; y += 5) {
    pessimisticChanges.push({ afterYear: y, newRate: initialRate + 0.5 * (y / 5) });
  }

  return [
    runVariableRateScenario("楽観", principal, initialRate, years, optimisticChanges),
    runVariableRateScenario("基準", principal, initialRate, years, standardChanges),
    runVariableRateScenario("悲観", principal, initialRate, years, pessimisticChanges),
  ];
}

function runVariableRateScenario(
  name: string,
  principal: number,
  initialRate: number,
  years: number,
  rateChanges: RateChange[],
): VariableRateScenario {
  const totalMonths = years * 12;
  const schedule: MonthlyScheduleItem[] = [];

  // Sort rate changes by year ascending
  const sortedChanges = [...rateChanges].sort((a, b) => a.afterYear - b.afterYear);

  // Determine effective rate at any given month
  const rateAtMonth = (month: number): number => {
    let rate = initialRate;
    for (const change of sortedChanges) {
      if (month > change.afterYear * 12) {
        rate = change.newRate;
      }
    }
    return rate;
  };

  let balance = principal;
  // Initial payment calculated at start with initial rate
  const initialPayment = calculateEqualPayment(principal, initialRate, years);
  let currentPayment = initialPayment;
  let previousPeriodPayment = currentPayment;

  for (let month = 1; month <= totalMonths; month++) {
    // 5-year rule: recalculate payment at start of each new 5-year period (months 61, 121, 181, ...)
    if (month > 1 && (month - 1) % 60 === 0) {
      const currentRate = rateAtMonth(month);
      const remainingMonths = totalMonths - month + 1;

      let newPayment: number;
      if (balance > 0 && remainingMonths > 0) {
        const monthlyRate = currentRate / 100 / 12;
        if (monthlyRate === 0) {
          newPayment = Math.round(balance / remainingMonths);
        } else {
          const factor = Math.pow(1 + monthlyRate, remainingMonths);
          newPayment = Math.round((balance * monthlyRate * factor) / (factor - 1));
        }
      } else {
        newPayment = currentPayment;
      }

      // 125% rule: cap new payment at 125% of previous period's payment
      const maxAllowed = Math.round(previousPeriodPayment * 1.25);
      currentPayment = Math.min(newPayment, maxAllowed);
      previousPeriodPayment = currentPayment;
    }

    const currentRate = rateAtMonth(month);
    const monthlyRate = currentRate / 100 / 12;
    const interest = Math.round(balance * monthlyRate);

    let principalPortion: number;
    let actualPayment: number;

    if (month === totalMonths) {
      // Final payment: clear remaining balance
      principalPortion = balance;
      actualPayment = balance + interest;
    } else if (interest >= currentPayment) {
      // Negative amortization: interest exceeds payment; add unpaid interest to balance
      principalPortion = 0;
      actualPayment = currentPayment;
      const unpaidInterest = interest - currentPayment;
      balance = balance + unpaidInterest;
    } else {
      principalPortion = currentPayment - interest;
      actualPayment = currentPayment;
    }

    balance = Math.max(0, balance - principalPortion);

    schedule.push({
      month,
      principal: principalPortion,
      interest,
      balance,
      payment: actualPayment,
    });
  }

  const yearlySummary = scheduleToYearlySummary(schedule);
  const totalRepayment = schedule.reduce((sum, item) => sum + item.payment, 0);

  // Report the effective rate at the final month for the scenario
  const finalRate = rateAtMonth(totalMonths);

  return {
    name,
    rate: finalRate,
    monthlyPayment: initialPayment,
    totalRepayment,
    yearlySummary,
  };
}
