import { createServerFn } from "@tanstack/react-start";
import { loanInputSchema } from "./validation";
import {
  calculateEqualPayment,
  calculateWithBonus,
  generateSchedule,
  calculateVariableRateScenarios,
} from "../lib/loan-calculator";
import { calculatePrepaymentEffect } from "../lib/prepayment-calculator";
import { calculateTaxDeduction } from "../lib/tax-deduction";
import { calculateClosingCosts } from "../lib/closing-costs";
import { calculateRentComparison } from "../lib/rent-comparison";
import type { LoanResult } from "../lib/types";

export const calculateLoan = createServerFn({ method: "POST" })
  .validator(loanInputSchema)
  .handler(async ({ data }): Promise<LoanResult> => {
    const principalMan = data.propertyPrice - data.downPayment;
    const principal = principalMan * 10_000;

    // 基本ローン計算
    let monthlyLoanPayment: number;
    if (data.bonusPayment > 0) {
      const bonus = calculateWithBonus(
        principal,
        data.interestRate,
        data.loanTermYears,
        data.bonusPayment * 10_000,
      );
      monthlyLoanPayment = bonus.monthlyPayment;
    } else {
      monthlyLoanPayment = calculateEqualPayment(principal, data.interestRate, data.loanTermYears);
    }

    // 月々の総支払額
    const totalMonthlyPayment =
      monthlyLoanPayment +
      data.maintenanceFee +
      data.repairReserve +
      (data.propertyTax * 10_000) / 12;

    // 返済スケジュール
    const schedule = generateSchedule(
      principal,
      data.interestRate,
      data.loanTermYears,
      data.repaymentMethod,
    );
    const totalRepayment = schedule.reduce((s, m) => s + m.payment, 0);
    const totalInterest = totalRepayment - principal;

    // 目安年収
    const annualPayment = monthlyLoanPayment * 12;
    const requiredIncome: Record<number, number> = {
      20: Math.ceil(annualPayment / 0.2),
      25: Math.ceil(annualPayment / 0.25),
      30: Math.ceil(annualPayment / 0.3),
    };

    // 変動金利シナリオ
    const scenarios =
      data.interestType === "variable"
        ? calculateVariableRateScenarios(principal, data.interestRate, data.loanTermYears)
        : undefined;

    // 繰り上げ返済
    const prepayment =
      data.prepayments.length > 0
        ? calculatePrepaymentEffect(
            principal,
            data.interestRate,
            data.loanTermYears,
            data.repaymentMethod,
            data.prepayments,
          )
        : undefined;

    // 住宅ローン控除
    const taxDeduction = calculateTaxDeduction(
      principal,
      data.interestRate,
      data.loanTermYears,
      data.propertyType,
      data.energyPerformance,
      data.isChildRearingHousehold,
    );

    // 諸費用
    const closingCosts = calculateClosingCosts(
      data.propertyPrice,
      principalMan,
      data.propertyType,
      data.bankType,
    );

    // 賃貸比較
    const maintenanceTotal =
      (data.maintenanceFee + data.repairReserve) * 12 * data.loanTermYears +
      data.propertyTax * 10_000 * data.loanTermYears;
    const purchaseTotal =
      data.downPayment * 10_000 + closingCosts.total + totalRepayment + maintenanceTotal;

    const rentComparison = data.currentRent
      ? calculateRentComparison(
          data.currentRent,
          data.rentIncreaseRate ?? 0.5,
          data.loanTermYears,
          purchaseTotal,
          taxDeduction.totalDeduction,
        )
      : undefined;

    return {
      monthlyLoanPayment,
      totalMonthlyPayment,
      totalRepayment,
      totalInterest,
      requiredIncome,
      schedule,
      scenarios,
      prepayment,
      taxDeduction,
      closingCosts,
      rentComparison,
    };
  });
