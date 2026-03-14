import { describe, expect, test } from "vite-plus/test";
import { loanInputSchema } from "../../server/validation";

describe("loanInputSchema", () => {
  const validInput = {
    propertyPrice: 3000,
    downPayment: 300,
    propertyType: "new" as const,
    interestType: "fixed" as const,
    interestRate: 1.5,
    loanTermYears: 35,
    repaymentMethod: "equal_payment" as const,
    bonusPayment: 0,
    bankType: "online" as const,
    maintenanceFee: 12000,
    repairReserve: 15000,
    propertyTax: 10,
    energyPerformance: "energy_standard" as const,
    isChildRearingHousehold: false,
    prepayments: [],
  };

  test("デフォルト値で通る", () => {
    const result = loanInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test("物件価格が100万円未満でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, propertyPrice: 50 });
    expect(result.success).toBe(false);
  });

  test("物件価格が50000万円超でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, propertyPrice: 50001 });
    expect(result.success).toBe(false);
  });

  test("金利0%でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, interestRate: 0 });
    expect(result.success).toBe(false);
  });

  test("金利15%超でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, interestRate: 15.1 });
    expect(result.success).toBe(false);
  });

  test("返済期間0年でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, loanTermYears: 0 });
    expect(result.success).toBe(false);
  });

  test("返済期間50年超でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, loanTermYears: 51 });
    expect(result.success).toBe(false);
  });

  test("頭金が物件価格を超えるとエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, downPayment: 3001 });
    expect(result.success).toBe(false);
  });

  test("繰り上げ返済は最大5件", () => {
    const prepayments = Array.from({ length: 6 }, (_, i) => ({
      year: i + 1,
      amount: 100,
      type: "shorten_term" as const,
    }));
    const result = loanInputSchema.safeParse({ ...validInput, prepayments });
    expect(result.success).toBe(false);
  });

  test("繰り上げ返済5件以内はOK", () => {
    const prepayments = Array.from({ length: 5 }, (_, i) => ({
      year: i + 1,
      amount: 100,
      type: "shorten_term" as const,
    }));
    const result = loanInputSchema.safeParse({ ...validInput, prepayments });
    expect(result.success).toBe(true);
  });

  test("家賃は任意入力", () => {
    const result = loanInputSchema.safeParse({ ...validInput, currentRent: 120000 });
    expect(result.success).toBe(true);
  });

  test("家賃50万円超でエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, currentRent: 500001 });
    expect(result.success).toBe(false);
  });

  test("変動金利タイプが有効", () => {
    const result = loanInputSchema.safeParse({ ...validInput, interestType: "variable" });
    expect(result.success).toBe(true);
  });

  test("フラット35タイプが有効", () => {
    const result = loanInputSchema.safeParse({ ...validInput, interestType: "flat35" });
    expect(result.success).toBe(true);
  });

  test("不正な金利タイプでエラー", () => {
    const result = loanInputSchema.safeParse({ ...validInput, interestType: "invalid" });
    expect(result.success).toBe(false);
  });
});
