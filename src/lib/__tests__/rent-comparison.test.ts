import { describe, expect, test } from "vite-plus/test";
import { calculateRentComparison } from "../rent-comparison";

describe("calculateRentComparison", () => {
  test("computes rent total with no annual increase", () => {
    // 10万円/月, 0% 増加, 10年
    const result = calculateRentComparison(100_000, 0, 10, 15_000_000, 0);
    // rentTotal = 100,000 * 12 * 10 = 12,000,000
    expect(result.rentTotal).toBe(12_000_000);
  });

  test("computes rent total with annual increase", () => {
    // 10万円/月, 1% 増加, 3年
    // Year1: 100,000*12 = 1,200,000
    // Year2: 101,000*12 = 1,212,000
    // Year3: 102,010*12 = 1,224,120 (101,000 * 1.01 = 102,010)
    const result = calculateRentComparison(100_000, 1, 3, 5_000_000, 0);
    const expected = 1_200_000 + 1_212_000 + 1_224_120;
    expect(result.rentTotal).toBeCloseTo(expected, -1);
  });

  test("purchaseTotal is passed through minus taxDeduction", () => {
    // purchaseTotal=20,000,000, taxDeduction=2,000,000
    // purchaseGrandTotal = 18,000,000
    const result = calculateRentComparison(100_000, 0, 35, 20_000_000, 2_000_000);
    expect(result.purchaseTotal).toBe(18_000_000);
  });

  test("difference is positive when purchase is cheaper (rentTotal > purchaseGrandTotal)", () => {
    // rent: 10万/月 * 35年 = 42,000,000
    // purchaseGrandTotal: 30,000,000
    const result = calculateRentComparison(100_000, 0, 35, 30_000_000, 0);
    expect(result.difference).toBeGreaterThan(0);
    expect(result.difference).toBe(result.rentTotal - result.purchaseTotal);
  });

  test("difference is negative when rent is cheaper", () => {
    // rent: 5万/月 * 10年 = 6,000,000
    // purchaseGrandTotal: 30,000,000
    const result = calculateRentComparison(50_000, 0, 10, 30_000_000, 0);
    expect(result.difference).toBeLessThan(0);
  });

  test("breakEvenYear is the first year cumulative rent >= purchaseGrandTotal", () => {
    // rent 10万/月, 0%, purchaseGrandTotal = 3,600,000 (3年分のレント)
    // 年ごと: 1,200,000, 2,400,000, 3,600,000
    // breakEven = year 3
    const result = calculateRentComparison(100_000, 0, 10, 3_600_000, 0);
    expect(result.breakEvenYear).toBe(3);
  });

  test("breakEvenYear is undefined when rent never catches up", () => {
    // rent 5万/月, 0%, 5年 = 3,000,000 total
    // purchaseGrandTotal = 5,000,000 (never reached in 5 years)
    const result = calculateRentComparison(50_000, 0, 5, 5_000_000, 0);
    expect(result.breakEvenYear).toBeUndefined();
  });

  test("breakEvenYear=1 when first year rent already exceeds purchase", () => {
    // rent 100万/月, purchaseGrandTotal = 500,000
    const result = calculateRentComparison(1_000_000, 0, 5, 500_000, 0);
    expect(result.breakEvenYear).toBe(1);
  });

  test("taxDeduction reduces purchaseTotal", () => {
    const withDeduction = calculateRentComparison(100_000, 0, 10, 15_000_000, 1_000_000);
    const withoutDeduction = calculateRentComparison(100_000, 0, 10, 15_000_000, 0);
    expect(withDeduction.purchaseTotal).toBe(14_000_000);
    expect(withoutDeduction.purchaseTotal).toBe(15_000_000);
  });
});
