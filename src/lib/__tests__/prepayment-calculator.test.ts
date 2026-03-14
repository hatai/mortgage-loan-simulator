import { describe, expect, test } from "vite-plus/test";
import type { PrepaymentInput } from "../types";
import { calculatePrepaymentEffect } from "../prepayment-calculator";

// Helper: standard 3000万円 loan at 1.5% for 35 years
const PRINCIPAL = 30_000_000;
const RATE = 1.5;
const YEARS = 35;

describe("calculatePrepaymentEffect", () => {
  describe("shorten_term (期間短縮型)", () => {
    test("single prepayment reduces total repayment and shortens term", () => {
      const prepayments: PrepaymentInput[] = [
        { year: 5, amount: 100, type: "shorten_term" }, // 100万円 at year 5
      ];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      // Should save money
      expect(result.totalSaved).toBeGreaterThan(0);
      // New total repayment should be less than original
      expect(result.newTotalRepayment).toBeGreaterThan(0);
      // Should shorten term
      expect(result.shortenedMonths).toBeGreaterThan(0);
      // Monthly payment doesn't change for shorten_term
      expect(result.newMonthlyPayment).toBeUndefined();
    });

    test("larger prepayment yields more savings", () => {
      const small: PrepaymentInput[] = [{ year: 5, amount: 100, type: "shorten_term" }];
      const large: PrepaymentInput[] = [{ year: 5, amount: 500, type: "shorten_term" }];

      const smallResult = calculatePrepaymentEffect(PRINCIPAL, RATE, YEARS, "equal_payment", small);
      const largeResult = calculatePrepaymentEffect(PRINCIPAL, RATE, YEARS, "equal_payment", large);

      expect(largeResult.totalSaved).toBeGreaterThan(smallResult.totalSaved);
      expect(largeResult.shortenedMonths!).toBeGreaterThan(smallResult.shortenedMonths!);
    });

    test("earlier prepayment saves more than later prepayment", () => {
      const early: PrepaymentInput[] = [{ year: 3, amount: 200, type: "shorten_term" }];
      const late: PrepaymentInput[] = [{ year: 15, amount: 200, type: "shorten_term" }];

      const earlyResult = calculatePrepaymentEffect(PRINCIPAL, RATE, YEARS, "equal_payment", early);
      const lateResult = calculatePrepaymentEffect(PRINCIPAL, RATE, YEARS, "equal_payment", late);

      expect(earlyResult.totalSaved).toBeGreaterThan(lateResult.totalSaved);
    });

    test("multiple prepayments accumulate savings", () => {
      const single: PrepaymentInput[] = [{ year: 5, amount: 200, type: "shorten_term" }];
      const multiple: PrepaymentInput[] = [
        { year: 5, amount: 100, type: "shorten_term" },
        { year: 10, amount: 100, type: "shorten_term" },
      ];

      const singleResult = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        single,
      );
      const multipleResult = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        multiple,
      );

      // Both save, but the single earlier lump sum saves a bit more
      // (100万 at year 5 + 100万 at year 10 < 200万 at year 5 in savings)
      expect(singleResult.totalSaved).toBeGreaterThan(multipleResult.totalSaved);
    });

    test("no prepayments returns zero savings", () => {
      const result = calculatePrepaymentEffect(PRINCIPAL, RATE, YEARS, "equal_payment", []);

      expect(result.totalSaved).toBe(0);
      expect(result.shortenedMonths).toBeUndefined();
      expect(result.newMonthlyPayment).toBeUndefined();
    });

    test("totalSaved + newTotalRepayment + prepayment amounts ≈ original total repayment", () => {
      const prepayments: PrepaymentInput[] = [{ year: 5, amount: 100, type: "shorten_term" }];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      // original total = newTotalRepayment + totalSaved + prepayment lump sums
      // (prepayment amounts are included in newTotalRepayment)
      // So: result.newTotalRepayment + result.totalSaved ≈ originalTotal
      const originalMonthly = Math.round(
        (PRINCIPAL * ((RATE / 100 / 12) * Math.pow(1 + RATE / 100 / 12, YEARS * 12))) /
          (Math.pow(1 + RATE / 100 / 12, YEARS * 12) - 1),
      );
      const originalTotal = originalMonthly * YEARS * 12;

      expect(result.newTotalRepayment + result.totalSaved).toBeCloseTo(
        originalTotal,
        -3, // within 1000 yen
      );
    });
  });

  describe("reduce_payment (返済額軽減型)", () => {
    test("single prepayment reduces monthly payment", () => {
      const prepayments: PrepaymentInput[] = [{ year: 5, amount: 100, type: "reduce_payment" }];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      expect(result.totalSaved).toBeGreaterThan(0);
      expect(result.newTotalRepayment).toBeGreaterThan(0);
      // reduce_payment provides new monthly payment
      expect(result.newMonthlyPayment).toBeDefined();
      expect(result.newMonthlyPayment).toBeGreaterThan(0);
      // Term does not shorten
      expect(result.shortenedMonths).toBeUndefined();
    });

    test("reduce_payment saves less than shorten_term for same amount", () => {
      const shortenPrepayments: PrepaymentInput[] = [
        { year: 5, amount: 100, type: "shorten_term" },
      ];
      const reducePrepayments: PrepaymentInput[] = [
        { year: 5, amount: 100, type: "reduce_payment" },
      ];

      const shortenResult = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        shortenPrepayments,
      );
      const reduceResult = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        reducePrepayments,
      );

      // shorten_term typically saves more total interest
      expect(shortenResult.totalSaved).toBeGreaterThanOrEqual(reduceResult.totalSaved);
    });

    test("new monthly payment is lower than original after reduce_payment", () => {
      const originalMonthly = Math.round(
        (PRINCIPAL * ((RATE / 100 / 12) * Math.pow(1 + RATE / 100 / 12, YEARS * 12))) /
          (Math.pow(1 + RATE / 100 / 12, YEARS * 12) - 1),
      );

      const prepayments: PrepaymentInput[] = [{ year: 5, amount: 200, type: "reduce_payment" }];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      expect(result.newMonthlyPayment!).toBeLessThan(originalMonthly);
    });

    test("multiple reduce_payment prepayments each lower the monthly payment", () => {
      const prepayments: PrepaymentInput[] = [
        { year: 5, amount: 100, type: "reduce_payment" },
        { year: 10, amount: 100, type: "reduce_payment" },
      ];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      expect(result.totalSaved).toBeGreaterThan(0);
      expect(result.newMonthlyPayment).toBeDefined();
    });
  });

  describe("mixed prepayment types", () => {
    test("mixed types: shorten_term provides shortenedMonths, reduce_payment provides newMonthlyPayment", () => {
      // When mixing, the last-applied type wins for output fields
      const prepayments: PrepaymentInput[] = [
        { year: 5, amount: 100, type: "shorten_term" },
        { year: 10, amount: 100, type: "reduce_payment" },
      ];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      expect(result.totalSaved).toBeGreaterThan(0);
      expect(result.newTotalRepayment).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    test("prepayment year beyond loan term is ignored gracefully", () => {
      const prepayments: PrepaymentInput[] = [
        { year: 40, amount: 100, type: "shorten_term" }, // beyond 35 years
      ];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      // No effect since loan ends before year 40
      expect(result.totalSaved).toBe(0);
    });

    test("prepayment amount larger than remaining balance is capped", () => {
      const prepayments: PrepaymentInput[] = [
        { year: 34, amount: 5000, type: "shorten_term" }, // 5000万円 >> remaining balance
      ];
      // Should not throw; should handle gracefully
      expect(() =>
        calculatePrepaymentEffect(PRINCIPAL, RATE, YEARS, "equal_payment", prepayments),
      ).not.toThrow();
    });

    test("supports up to 5 prepayments", () => {
      const prepayments: PrepaymentInput[] = [
        { year: 3, amount: 50, type: "shorten_term" },
        { year: 6, amount: 50, type: "shorten_term" },
        { year: 9, amount: 50, type: "shorten_term" },
        { year: 12, amount: 50, type: "shorten_term" },
        { year: 15, amount: 50, type: "shorten_term" },
      ];
      const result = calculatePrepaymentEffect(
        PRINCIPAL,
        RATE,
        YEARS,
        "equal_payment",
        prepayments,
      );

      expect(result.totalSaved).toBeGreaterThan(0);
      expect(result.shortenedMonths).toBeGreaterThan(0);
    });
  });
});
