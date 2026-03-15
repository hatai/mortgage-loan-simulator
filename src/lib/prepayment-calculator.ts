import { calculateEqualPayment } from "./loan-calculator";
import type { PrepaymentEffect, PrepaymentInput, RepaymentMethod } from "./types";

/**
 * Simulate the effect of prepayments on a mortgage loan.
 *
 * Simulates month-by-month amortization, applying each prepayment at the
 * specified year (year * 12 = month index). Supports two prepayment types:
 *
 * - shorten_term (期間短縮型): Monthly payment stays constant, term shortens.
 * - reduce_payment (返済額軽減型): Remaining term stays constant, monthly
 *   payment is recalculated (lower) after the prepayment.
 *
 * @param principal    - Original loan principal in yen
 * @param annualRate   - Annual interest rate as a percentage (e.g. 1.5)
 * @param years        - Original loan term in years
 * @param method       - Repayment method ('equal_payment' | 'equal_principal')
 * @param prepayments  - Up to 5 prepayment instructions
 * @returns PrepaymentEffect summarising the savings
 */
export function calculatePrepaymentEffect(
  principal: number,
  annualRate: number,
  years: number,
  method: RepaymentMethod,
  prepayments: PrepaymentInput[],
): PrepaymentEffect {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  // ---- Original total repayment (no prepayments) ----
  let originalTotal: number;
  if (method === "equal_payment") {
    const originalPayment = calculateEqualPayment(principal, annualRate, years);
    originalTotal = originalPayment * totalMonths;
  } else {
    // equal_principal: sum of all payments
    let bal = principal;
    originalTotal = 0;
    const principalPerMonth = Math.round(principal / totalMonths);
    for (let m = 1; m <= totalMonths; m++) {
      const interest = Math.round(bal * monthlyRate);
      originalTotal += principalPerMonth + interest;
      bal -= principalPerMonth;
    }
  }

  // Early exit when no prepayments
  if (prepayments.length === 0) {
    return {
      totalSaved: 0,
      newTotalRepayment: originalTotal,
    };
  }

  // Sort prepayments by year so we apply them in chronological order
  const sorted = [...prepayments].sort((a, b) => a.year - b.year);

  // Build a lookup: prepayment month -> list of PrepaymentInputs
  const prepaymentMap = new Map<number, PrepaymentInput[]>();
  for (const p of sorted) {
    const month = p.year * 12;
    if (!prepaymentMap.has(month)) prepaymentMap.set(month, []);
    prepaymentMap.get(month)!.push(p);
  }

  // ---- Month-by-month simulation ----
  let balance = principal;
  let currentMonthlyPayment = calculateEqualPayment(principal, annualRate, years);
  let remainingMonths = totalMonths;

  let newTotal = 0;
  let lastReducePayment: number | undefined;
  let shortenedMonths: number | undefined;

  for (let m = 1; m <= remainingMonths; m++) {
    // Apply any prepayments scheduled at this month
    const prepaymentsNow = prepaymentMap.get(m);
    if (prepaymentsNow && balance > 0) {
      for (const p of prepaymentsNow) {
        const amount = p.amount * 10_000; // 万円 → 円
        const actualAmount = Math.min(amount, balance);
        balance -= actualAmount;
        newTotal += actualAmount; // prepayment lump sum is part of total outflow

        if (balance <= 0) break;

        if (p.type === "reduce_payment") {
          // Remaining months unchanged, recalculate lower monthly payment
          const remaining = remainingMonths - m;
          if (remaining > 0) {
            const newPayment = calculateEqualPayment(balance, annualRate, remaining / 12);
            currentMonthlyPayment = newPayment;
            lastReducePayment = newPayment;
          }
        }
        // shorten_term: monthly payment stays the same, the loop will end early
        // when balance reaches 0
      }
    }

    if (balance <= 0) {
      // Loan fully paid off by prepayment; remaining months shortened
      const usedMonths = m;
      const originalFinishMonth = totalMonths;
      if (usedMonths < originalFinishMonth) {
        shortenedMonths = (shortenedMonths ?? 0) + (originalFinishMonth - usedMonths);
      }
      break;
    }

    // Regular monthly payment
    const interest = Math.round(balance * monthlyRate);
    let principalPayment: number;

    if (currentMonthlyPayment >= balance + interest) {
      // Final payment: pay off the rest
      principalPayment = balance;
      newTotal += balance + interest;
      balance = 0;
      // Calculate how many months early we finished
      const usedMonths = m;
      if (usedMonths < remainingMonths) {
        shortenedMonths = (shortenedMonths ?? 0) + (remainingMonths - usedMonths);
      }
      break;
    } else {
      principalPayment = currentMonthlyPayment - interest;
      newTotal += currentMonthlyPayment;
      balance -= principalPayment;
    }
  }

  const totalSaved = Math.max(0, originalTotal - newTotal);

  return {
    totalSaved,
    newTotalRepayment: newTotal,
    ...(shortenedMonths !== undefined && shortenedMonths > 0 ? { shortenedMonths } : {}),
    ...(lastReducePayment !== undefined ? { newMonthlyPayment: lastReducePayment } : {}),
  };
}
