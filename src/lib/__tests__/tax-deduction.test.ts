import { describe, expect, test } from "vite-plus/test";
import { getBorrowingLimit, calculateTaxDeduction } from "../tax-deduction";

describe("getBorrowingLimit", () => {
  describe("new housing (新築)", () => {
    test("certified - general household", () => {
      expect(getBorrowingLimit("new", "certified", false)).toBe(45_000_000);
    });

    test("certified - child-rearing household", () => {
      expect(getBorrowingLimit("new", "certified", true)).toBe(50_000_000);
    });

    test("zeh - general household", () => {
      expect(getBorrowingLimit("new", "zeh", false)).toBe(35_000_000);
    });

    test("zeh - child-rearing household", () => {
      expect(getBorrowingLimit("new", "zeh", true)).toBe(45_000_000);
    });

    test("energy_standard - general household", () => {
      expect(getBorrowingLimit("new", "energy_standard", false)).toBe(20_000_000);
    });

    test("energy_standard - child-rearing household", () => {
      expect(getBorrowingLimit("new", "energy_standard", true)).toBe(30_000_000);
    });

    test("other - general household (not eligible)", () => {
      expect(getBorrowingLimit("new", "other", false)).toBe(0);
    });

    test("other - child-rearing household (not eligible)", () => {
      expect(getBorrowingLimit("new", "other", true)).toBe(0);
    });
  });

  describe("existing/used housing (中古)", () => {
    test("certified - general household", () => {
      expect(getBorrowingLimit("used", "certified", false)).toBe(35_000_000);
    });

    test("certified - child-rearing household", () => {
      expect(getBorrowingLimit("used", "certified", true)).toBe(45_000_000);
    });

    test("zeh - general household", () => {
      expect(getBorrowingLimit("used", "zeh", false)).toBe(35_000_000);
    });

    test("zeh - child-rearing household", () => {
      expect(getBorrowingLimit("used", "zeh", true)).toBe(45_000_000);
    });

    test("energy_standard - general household", () => {
      expect(getBorrowingLimit("used", "energy_standard", false)).toBe(20_000_000);
    });

    test("energy_standard - child-rearing household", () => {
      expect(getBorrowingLimit("used", "energy_standard", true)).toBe(30_000_000);
    });

    test("other - general household", () => {
      expect(getBorrowingLimit("used", "other", false)).toBe(20_000_000);
    });

    test("other - child-rearing household", () => {
      expect(getBorrowingLimit("used", "other", true)).toBe(20_000_000);
    });
  });
});

describe("calculateTaxDeduction", () => {
  test("returns TaxDeduction object with correct shape", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    expect(result).toHaveProperty("borrowingLimit");
    expect(result).toHaveProperty("yearlyDeductions");
    expect(result).toHaveProperty("totalDeduction");
    expect(result).toHaveProperty("effectiveTotalRepayment");
  });

  test("borrowingLimit matches getBorrowingLimit", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    expect(result.borrowingLimit).toBe(45_000_000);
  });

  test("yearlyDeductions has 13 entries (deduction period is 13 years)", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    expect(result.yearlyDeductions).toHaveLength(13);
  });

  test("yearly deductions have correct structure", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    for (const entry of result.yearlyDeductions) {
      expect(entry).toHaveProperty("year");
      expect(entry).toHaveProperty("amount");
      expect(entry).toHaveProperty("balance");
      expect(entry.year).toBeGreaterThanOrEqual(1);
      expect(entry.year).toBeLessThanOrEqual(13);
      expect(entry.amount).toBeGreaterThan(0);
      expect(entry.balance).toBeGreaterThan(0);
    }
  });

  test("deduction rate is 0.7% of year-end balance", () => {
    // With principal less than borrowing limit, deduction = balance * 0.007
    const result = calculateTaxDeduction(10_000_000, 1.0, 35, "new", "certified", false);
    const firstYear = result.yearlyDeductions[0];
    const expectedDeduction = Math.floor(firstYear.balance * 0.007);
    expect(firstYear.amount).toBe(expectedDeduction);
  });

  test("deduction is capped at borrowing limit when principal exceeds limit", () => {
    // principal 50M > borrowing limit 45M for new/certified/general
    const result = calculateTaxDeduction(50_000_000, 1.0, 35, "new", "certified", false);
    const firstYear = result.yearlyDeductions[0];
    // balance would be close to 50M, but limit is 45M
    // deduction = min(balance, 45M) * 0.007
    const expectedDeduction = Math.floor(45_000_000 * 0.007);
    expect(firstYear.amount).toBe(expectedDeduction);
  });

  test("totalDeduction is sum of all yearlyDeductions amounts", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    const sumOfDeductions = result.yearlyDeductions.reduce((sum, d) => sum + d.amount, 0);
    expect(result.totalDeduction).toBe(sumOfDeductions);
  });

  test("effectiveTotalRepayment uses total repayment minus totalDeduction", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    // effectiveTotalRepayment = total repayment - totalDeduction
    expect(result.effectiveTotalRepayment).toBeLessThan(
      result.yearlyDeductions.reduce((sum, d) => sum + d.balance, 0),
    );
    // It should be a positive number
    expect(result.effectiveTotalRepayment).toBeGreaterThan(0);
  });

  test("returns zero deductions for new/other housing (not eligible)", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "other", false);
    expect(result.borrowingLimit).toBe(0);
    expect(result.totalDeduction).toBe(0);
    expect(result.yearlyDeductions).toHaveLength(0);
  });

  test("child-rearing household gets higher deduction limit", () => {
    const generalResult = calculateTaxDeduction(40_000_000, 1.0, 35, "new", "zeh", false);
    const childResult = calculateTaxDeduction(40_000_000, 1.0, 35, "new", "zeh", true);
    // general limit = 35M, child limit = 45M
    // principal 40M > general limit 35M, so general is capped at 35M
    // principal 40M < child limit 45M, so child uses actual balance
    expect(childResult.totalDeduction).toBeGreaterThan(generalResult.totalDeduction);
  });

  test("used housing other type still has borrowing limit of 20M", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "used", "other", false);
    expect(result.borrowingLimit).toBe(20_000_000);
    expect(result.totalDeduction).toBeGreaterThan(0);
    expect(result.yearlyDeductions).toHaveLength(13);
  });

  test("deduction decreases over time as balance decreases", () => {
    const result = calculateTaxDeduction(20_000_000, 1.5, 35, "new", "energy_standard", false);
    // Year-end balance decreases, so deductions should generally decrease
    const firstYearAmount = result.yearlyDeductions[0].amount;
    const lastYearAmount = result.yearlyDeductions[12].amount;
    expect(firstYearAmount).toBeGreaterThan(lastYearAmount);
  });

  test("zero interest rate loan calculates correctly", () => {
    const principal = 10_000_000;
    const result = calculateTaxDeduction(principal, 0, 35, "new", "certified", false);
    expect(result.yearlyDeductions).toHaveLength(13);
    // With 0% rate, balance decreases linearly
    const firstYear = result.yearlyDeductions[0];
    const expectedBalance = principal - principal / 35; // approximately after year 1
    expect(firstYear.balance).toBeCloseTo(expectedBalance, -4); // within ~10000 yen
  });

  test("loan term shorter than 13 years still works correctly", () => {
    const result = calculateTaxDeduction(10_000_000, 1.5, 10, "new", "certified", false);
    // With 10 year term, balance is 0 after year 10, deductions for years 11-13 should be 0
    const afterLoanEnd = result.yearlyDeductions.filter((d) => d.year > 10);
    for (const entry of afterLoanEnd) {
      expect(entry.amount).toBe(0);
      expect(entry.balance).toBe(0);
    }
  });
});
