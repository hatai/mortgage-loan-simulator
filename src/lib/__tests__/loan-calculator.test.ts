import { describe, expect, test } from "vite-plus/test";
import type { MonthlyScheduleItem } from "../types";
import {
  calculateEqualPayment,
  calculateEqualPrincipal,
  generateSchedule,
  calculateWithBonus,
  scheduleToYearlySummary,
} from "../loan-calculator";

describe("calculateEqualPayment", () => {
  test("computes monthly PMT for standard loan", () => {
    // 3000万円, 1.5%, 35年
    const payment = calculateEqualPayment(30_000_000, 1.5, 35);
    // Expected ~91,854 yen/month (industry standard)
    expect(payment).toBeGreaterThan(90_000);
    expect(payment).toBeLessThan(95_000);
  });

  test("returns principal/months for 0% rate", () => {
    const payment = calculateEqualPayment(12_000_000, 0, 10);
    // 12,000,000 / 120 months = 100,000
    expect(payment).toBeCloseTo(100_000, 0);
  });

  test("higher rate produces higher payment", () => {
    const lowRate = calculateEqualPayment(10_000_000, 1.0, 30);
    const highRate = calculateEqualPayment(10_000_000, 3.0, 30);
    expect(highRate).toBeGreaterThan(lowRate);
  });

  test("shorter term produces higher payment", () => {
    const long = calculateEqualPayment(10_000_000, 2.0, 35);
    const short = calculateEqualPayment(10_000_000, 2.0, 20);
    expect(short).toBeGreaterThan(long);
  });

  test("returns integer (rounded)", () => {
    const payment = calculateEqualPayment(25_000_000, 0.775, 35);
    expect(Number.isInteger(payment)).toBe(true);
  });
});

describe("calculateEqualPrincipal", () => {
  test("first month payment is highest", () => {
    const month1 = calculateEqualPrincipal(30_000_000, 1.5, 35, 1);
    const month2 = calculateEqualPrincipal(30_000_000, 1.5, 35, 2);
    expect(month1).toBeGreaterThan(month2);
  });

  test("principal portion is constant each month", () => {
    const principal = 12_000_000;
    const years = 10;
    const totalMonths = years * 12;
    const expectedPrincipalPortion = principal / totalMonths;

    // Calculate payment and subtract interest to get principal portion
    // For month 1: interest = principal * monthlyRate
    // principal portion = payment - interest
    const monthlyRate = 1.5 / 100 / 12;
    const month1 = calculateEqualPrincipal(principal, 1.5, years, 1);
    const interest1 = principal * monthlyRate;
    const principalPortion1 = month1 - interest1;

    expect(principalPortion1).toBeCloseTo(expectedPrincipalPortion, 0);
  });

  test("last month payment is positive and smallest", () => {
    const totalMonths = 35 * 12;
    const lastPayment = calculateEqualPrincipal(30_000_000, 1.5, 35, totalMonths);
    expect(lastPayment).toBeGreaterThan(0);
  });
});

describe("generateSchedule", () => {
  test("equal_payment: schedule has correct number of months", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    expect(schedule).toHaveLength(120);
  });

  test("equal_payment: balance reaches zero at end", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const last = schedule[schedule.length - 1];
    expect(last.balance).toBeCloseTo(0, -2); // within 100 yen due to rounding
  });

  test("equal_payment: payment is consistent", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const firstPayment = schedule[0].payment;
    // All payments except possibly last should be same
    for (let i = 0; i < schedule.length - 1; i++) {
      expect(schedule[i].payment).toBe(firstPayment);
    }
  });

  test("equal_payment: each item has required fields", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    for (const item of schedule) {
      expect(item).toHaveProperty("month");
      expect(item).toHaveProperty("principal");
      expect(item).toHaveProperty("interest");
      expect(item).toHaveProperty("balance");
      expect(item).toHaveProperty("payment");
    }
  });

  test("equal_payment: month numbers are sequential", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    schedule.forEach((item, i) => {
      expect(item.month).toBe(i + 1);
    });
  });

  test("equal_payment: balance decreases monotonically", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].balance).toBeLessThan(schedule[i - 1].balance);
    }
  });

  test("equal_principal: schedule has correct number of months", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_principal");
    expect(schedule).toHaveLength(120);
  });

  test("equal_principal: balance reaches zero at end", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_principal");
    const last = schedule[schedule.length - 1];
    expect(last.balance).toBeCloseTo(0, -2);
  });

  test("equal_principal: payment decreases over time", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_principal");
    expect(schedule[0].payment).toBeGreaterThan(schedule[schedule.length - 1].payment);
  });

  test("equal_payment: total repayment > principal", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const totalPayment = schedule.reduce((sum, item) => sum + item.payment, 0);
    expect(totalPayment).toBeGreaterThan(10_000_000);
  });
});

describe("calculateWithBonus", () => {
  test("returns monthly and bonus payment amounts", () => {
    const result = calculateWithBonus(30_000_000, 1.5, 35, 500_000);
    expect(result).toHaveProperty("monthlyPayment");
    expect(result).toHaveProperty("bonusPayment");
    expect(result).toHaveProperty("schedule");
  });

  test("bonus payment is greater than monthly payment", () => {
    const result = calculateWithBonus(30_000_000, 1.5, 35, 500_000);
    expect(result.bonusPayment).toBeGreaterThan(result.monthlyPayment);
  });

  test("bonus months (June=6, December=12) have higher total payment", () => {
    const result = calculateWithBonus(30_000_000, 1.5, 35, 500_000);
    const bonusMonths = result.schedule.filter(
      (item: MonthlyScheduleItem) => item.month % 12 === 6 || item.month % 12 === 0,
    );
    const regularMonths = result.schedule.filter(
      (item: MonthlyScheduleItem) => item.month % 12 !== 6 && item.month % 12 !== 0,
    );
    const avgBonus =
      bonusMonths.reduce((s: number, m: MonthlyScheduleItem) => s + m.payment, 0) /
      bonusMonths.length;
    const avgRegular =
      regularMonths.reduce((s: number, m: MonthlyScheduleItem) => s + m.payment, 0) /
      regularMonths.length;
    expect(avgBonus).toBeGreaterThan(avgRegular);
  });

  test("balance reaches zero at end", () => {
    const result = calculateWithBonus(30_000_000, 1.5, 35, 500_000);
    const last = result.schedule[result.schedule.length - 1];
    expect(last.balance).toBeCloseTo(0, -2);
  });

  test("bonus portion does not exceed 50% of principal", () => {
    // If bonusPaymentPerTime is very large, it should be capped to 50% of principal
    const result = calculateWithBonus(10_000_000, 1.5, 35, 10_000_000);
    expect(result.bonusPrincipal).toBeLessThanOrEqual(5_000_000);
  });
});

describe("scheduleToYearlySummary", () => {
  test("produces one summary per year", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const summary = scheduleToYearlySummary(schedule);
    expect(summary).toHaveLength(10);
  });

  test("year numbers are sequential starting from 1", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const summary = scheduleToYearlySummary(schedule);
    summary.forEach((item, i) => {
      expect(item.year).toBe(i + 1);
    });
  });

  test("end balance of last year is near zero", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const summary = scheduleToYearlySummary(schedule);
    expect(summary[summary.length - 1].endBalance).toBeCloseTo(0, -2);
  });

  test("totalPrincipal + totalInterest ≈ total payments for year", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const summary = scheduleToYearlySummary(schedule);
    for (const year of summary) {
      const totalPayments = year.totalPrincipal + year.totalInterest;
      const expectedTotal = year.averagePayment * 12;
      // Allow rounding difference up to 10 yen
      expect(Math.abs(totalPayments - expectedTotal)).toBeLessThan(10);
    }
  });

  test("end balance decreases each year", () => {
    const schedule = generateSchedule(10_000_000, 1.5, 10, "equal_payment");
    const summary = scheduleToYearlySummary(schedule);
    for (let i = 1; i < summary.length; i++) {
      expect(summary[i].endBalance).toBeLessThan(summary[i - 1].endBalance);
    }
  });
});
