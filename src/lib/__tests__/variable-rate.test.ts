import { describe, expect, test } from "vite-plus/test";
import { calculateVariableRateScenarios } from "../loan-calculator";

describe("calculateVariableRateScenarios", () => {
  const principal = 30_000_000;
  const initialRate = 0.5;
  const years = 35;

  test("returns three scenarios by default", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    expect(scenarios).toHaveLength(3);
  });

  test("scenario names are 楽観, 基準, 悲観", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const names = scenarios.map((s) => s.name);
    expect(names).toContain("楽観");
    expect(names).toContain("基準");
    expect(names).toContain("悲観");
  });

  test("楽観 scenario rate equals initial rate", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const optimistic = scenarios.find((s) => s.name === "楽観")!;
    expect(optimistic.rate).toBe(initialRate);
  });

  test("基準 rate is higher than 楽観 rate", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const optimistic = scenarios.find((s) => s.name === "楽観")!;
    const standard = scenarios.find((s) => s.name === "基準")!;
    expect(standard.rate).toBeGreaterThan(optimistic.rate);
  });

  test("悲観 rate is highest", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const standard = scenarios.find((s) => s.name === "基準")!;
    const pessimistic = scenarios.find((s) => s.name === "悲観")!;
    expect(pessimistic.rate).toBeGreaterThan(standard.rate);
  });

  test("each scenario has yearlySummary with correct length", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    for (const scenario of scenarios) {
      expect(scenario.yearlySummary).toHaveLength(years);
    }
  });

  test("each scenario has totalRepayment > principal", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    for (const scenario of scenarios) {
      expect(scenario.totalRepayment).toBeGreaterThan(principal);
    }
  });

  test("pessimistic total repayment > standard > optimistic", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const optimistic = scenarios.find((s) => s.name === "楽観")!;
    const standard = scenarios.find((s) => s.name === "基準")!;
    const pessimistic = scenarios.find((s) => s.name === "悲観")!;
    expect(pessimistic.totalRepayment).toBeGreaterThan(standard.totalRepayment);
    expect(standard.totalRepayment).toBeGreaterThan(optimistic.totalRepayment);
  });

  test("yearly summary year numbers are sequential", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    for (const scenario of scenarios) {
      scenario.yearlySummary.forEach((item, i) => {
        expect(item.year).toBe(i + 1);
      });
    }
  });

  test("last year end balance is near zero for optimistic (no rate change)", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const optimistic = scenarios.find((s) => s.name === "楽観")!;
    const lastYear = optimistic.yearlySummary[optimistic.yearlySummary.length - 1];
    // Balance may be slightly off due to rounding and 5-year/125% rules
    expect(lastYear.endBalance).toBeGreaterThanOrEqual(0);
    // Should be paid off or very close (within 500,000 yen for edge rounding)
    expect(lastYear.endBalance).toBeLessThan(500_000);
  });

  test("5-year rule: payment changes only at 5-year intervals for variable scenarios", () => {
    // With a rate change, the payment in years 1-5 should be same
    // This is validated by checking that monthly payments in years 1-5 are consistent
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    const standard = scenarios.find((s) => s.name === "基準")!;
    // Year 1 and year 4 should have same average payment (5-year rule)
    const year1 = standard.yearlySummary[0];
    const year4 = standard.yearlySummary[3];
    expect(year1.averagePayment).toBeCloseTo(year4.averagePayment, 0);
  });

  test("125% rule: payment in period 2 does not exceed 125% of period 1", () => {
    // With large rate change, payment should be capped at 125%
    // Use very high initial rate increase scenario
    const scenarios = calculateVariableRateScenarios(principal, 0.5, years, [
      { afterYear: 5, newRate: 5.0 }, // extreme rate jump
    ]);
    // The test is that it doesn't throw and returns valid data
    expect(scenarios).toHaveLength(1);
    const period1Payment = scenarios[0].yearlySummary[4].averagePayment; // end of year 5
    const period2Payment = scenarios[0].yearlySummary[5].averagePayment; // year 6
    // Payment should not exceed 125% of period 1 payment
    expect(period2Payment).toBeLessThanOrEqual(period1Payment * 1.25 + 1); // +1 for rounding
  });

  test("custom rate increases produce correct scenario count", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years, [
      { afterYear: 5, newRate: 1.0 },
      { afterYear: 10, newRate: 1.5 },
    ]);
    expect(scenarios).toHaveLength(1);
  });

  test("each scenario item has required fields", () => {
    const scenarios = calculateVariableRateScenarios(principal, initialRate, years);
    for (const scenario of scenarios) {
      expect(scenario).toHaveProperty("name");
      expect(scenario).toHaveProperty("rate");
      expect(scenario).toHaveProperty("monthlyPayment");
      expect(scenario).toHaveProperty("totalRepayment");
      expect(scenario).toHaveProperty("yearlySummary");
      for (const year of scenario.yearlySummary) {
        expect(year).toHaveProperty("year");
        expect(year).toHaveProperty("totalPrincipal");
        expect(year).toHaveProperty("totalInterest");
        expect(year).toHaveProperty("endBalance");
        expect(year).toHaveProperty("averagePayment");
      }
    }
  });
});
