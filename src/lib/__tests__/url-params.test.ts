import { describe, expect, test } from "vite-plus/test";
import { encodeParams, decodeParams } from "../url-params";
import { DEFAULT_LOAN_INPUT } from "../types";
import type { LoanInput } from "../types";

describe("encodeParams", () => {
  test("returns empty string for default values", () => {
    const result = encodeParams(DEFAULT_LOAN_INPUT);
    expect(result).toBe("");
  });

  test("encodes non-default propertyPrice", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, propertyPrice: 5000 };
    const result = encodeParams(input);
    expect(result).toContain("p=5000");
  });

  test("encodes non-default downPayment", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, downPayment: 500 };
    const result = encodeParams(input);
    expect(result).toContain("d=500");
  });

  test("encodes non-default interestType", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, interestType: "variable" };
    const result = encodeParams(input);
    expect(result).toContain("t=variable");
  });

  test("encodes non-default interestRate", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, interestRate: 0.5 };
    const result = encodeParams(input);
    expect(result).toContain("r=0.5");
  });

  test("encodes non-default loanTermYears", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, loanTermYears: 25 };
    const result = encodeParams(input);
    expect(result).toContain("y=25");
  });

  test("encodes non-default repaymentMethod", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, repaymentMethod: "equal_principal" };
    const result = encodeParams(input);
    expect(result).toContain("m=equal_principal");
  });

  test("encodes non-default bonusPayment", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, bonusPayment: 500000 };
    const result = encodeParams(input);
    expect(result).toContain("b=500000");
  });

  test("encodes non-default maintenanceFee", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, maintenanceFee: 20000 };
    const result = encodeParams(input);
    expect(result).toContain("mf=20000");
  });

  test("encodes non-default repairReserve", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, repairReserve: 20000 };
    const result = encodeParams(input);
    expect(result).toContain("rr=20000");
  });

  test("encodes non-default propertyTax", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, propertyTax: 15 };
    const result = encodeParams(input);
    expect(result).toContain("pt=15");
  });

  test("encodes non-default propertyType", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, propertyType: "used" };
    const result = encodeParams(input);
    expect(result).toContain("ptype=used");
  });

  test("encodes non-default bankType", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, bankType: "major" };
    const result = encodeParams(input);
    expect(result).toContain("bank=major");
  });

  test("encodes non-default energyPerformance", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, energyPerformance: "zeh" };
    const result = encodeParams(input);
    expect(result).toContain("ep=zeh");
  });

  test("encodes isChildRearingHousehold=true as 1", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, isChildRearingHousehold: true };
    const result = encodeParams(input);
    expect(result).toContain("child=1");
  });

  test("skips isChildRearingHousehold=false (default)", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, isChildRearingHousehold: false };
    const result = encodeParams(input);
    expect(result).not.toContain("child=");
  });

  test("encodes currentRent when provided", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, currentRent: 100000 };
    const result = encodeParams(input);
    expect(result).toContain("rent=100000");
  });

  test("encodes rentIncreaseRate when provided", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, rentIncreaseRate: 1 };
    const result = encodeParams(input);
    expect(result).toContain("ri=1");
  });

  test("skips prepayments array", () => {
    const input: LoanInput = {
      ...DEFAULT_LOAN_INPUT,
      prepayments: [{ year: 5, amount: 1000000, type: "shorten_term" }],
    };
    const result = encodeParams(input);
    expect(result).not.toContain("prepay");
    expect(result).not.toContain("shorten");
  });

  test("encodes multiple non-default values", () => {
    const input: LoanInput = {
      ...DEFAULT_LOAN_INPUT,
      propertyPrice: 4000,
      downPayment: 400,
      loanTermYears: 30,
    };
    const result = encodeParams(input);
    expect(result).toContain("p=4000");
    expect(result).toContain("d=400");
    expect(result).toContain("y=30");
  });
});

describe("decodeParams", () => {
  test("returns defaults for empty string", () => {
    const result = decodeParams("");
    expect(result.propertyPrice).toBe(DEFAULT_LOAN_INPUT.propertyPrice);
    expect(result.downPayment).toBe(DEFAULT_LOAN_INPUT.downPayment);
    expect(result.interestType).toBe(DEFAULT_LOAN_INPUT.interestType);
  });

  test("decodes propertyPrice", () => {
    const result = decodeParams("p=5000");
    expect(result.propertyPrice).toBe(5000);
  });

  test("decodes downPayment", () => {
    const result = decodeParams("d=500");
    expect(result.downPayment).toBe(500);
  });

  test("decodes interestType", () => {
    const result = decodeParams("t=variable");
    expect(result.interestType).toBe("variable");
  });

  test("decodes interestRate", () => {
    const result = decodeParams("r=0.5");
    expect(result.interestRate).toBe(0.5);
  });

  test("decodes loanTermYears", () => {
    const result = decodeParams("y=25");
    expect(result.loanTermYears).toBe(25);
  });

  test("decodes repaymentMethod", () => {
    const result = decodeParams("m=equal_principal");
    expect(result.repaymentMethod).toBe("equal_principal");
  });

  test("decodes bonusPayment", () => {
    const result = decodeParams("b=500000");
    expect(result.bonusPayment).toBe(500000);
  });

  test("decodes maintenanceFee", () => {
    const result = decodeParams("mf=20000");
    expect(result.maintenanceFee).toBe(20000);
  });

  test("decodes repairReserve", () => {
    const result = decodeParams("rr=20000");
    expect(result.repairReserve).toBe(20000);
  });

  test("decodes propertyTax", () => {
    const result = decodeParams("pt=15");
    expect(result.propertyTax).toBe(15);
  });

  test("decodes propertyType", () => {
    const result = decodeParams("ptype=used");
    expect(result.propertyType).toBe("used");
  });

  test("decodes bankType", () => {
    const result = decodeParams("bank=major");
    expect(result.bankType).toBe("major");
  });

  test("decodes energyPerformance", () => {
    const result = decodeParams("ep=zeh");
    expect(result.energyPerformance).toBe("zeh");
  });

  test("decodes child=1 as isChildRearingHousehold=true", () => {
    const result = decodeParams("child=1");
    expect(result.isChildRearingHousehold).toBe(true);
  });

  test("decodes child=0 as isChildRearingHousehold=false", () => {
    const result = decodeParams("child=0");
    expect(result.isChildRearingHousehold).toBe(false);
  });

  test("decodes currentRent", () => {
    const result = decodeParams("rent=100000");
    expect(result.currentRent).toBe(100000);
  });

  test("decodes rentIncreaseRate", () => {
    const result = decodeParams("ri=1");
    expect(result.rentIncreaseRate).toBe(1);
  });

  test("falls back to default for invalid numeric value", () => {
    const result = decodeParams("p=notanumber");
    expect(result.propertyPrice).toBe(DEFAULT_LOAN_INPUT.propertyPrice);
  });

  test("falls back to default for invalid interestType", () => {
    const result = decodeParams("t=invalid");
    expect(result.interestType).toBe(DEFAULT_LOAN_INPUT.interestType);
  });

  test("falls back to default for invalid repaymentMethod", () => {
    const result = decodeParams("m=invalid");
    expect(result.repaymentMethod).toBe(DEFAULT_LOAN_INPUT.repaymentMethod);
  });

  test("always returns empty prepayments array", () => {
    const result = decodeParams("p=5000");
    expect(result.prepayments).toEqual([]);
  });

  test("round-trip: encode then decode returns same values for non-default input", () => {
    const input: LoanInput = {
      ...DEFAULT_LOAN_INPUT,
      propertyPrice: 4500,
      downPayment: 450,
      interestType: "variable",
      interestRate: 0.375,
      loanTermYears: 30,
      repaymentMethod: "equal_principal",
      propertyType: "used",
      bankType: "major",
      energyPerformance: "zeh",
      isChildRearingHousehold: true,
      currentRent: 80000,
      rentIncreaseRate: 0.5,
    };
    const encoded = encodeParams(input);
    const decoded = decodeParams(encoded);
    expect(decoded.propertyPrice).toBe(input.propertyPrice);
    expect(decoded.downPayment).toBe(input.downPayment);
    expect(decoded.interestType).toBe(input.interestType);
    expect(decoded.interestRate).toBe(input.interestRate);
    expect(decoded.loanTermYears).toBe(input.loanTermYears);
    expect(decoded.repaymentMethod).toBe(input.repaymentMethod);
    expect(decoded.propertyType).toBe(input.propertyType);
    expect(decoded.bankType).toBe(input.bankType);
    expect(decoded.energyPerformance).toBe(input.energyPerformance);
    expect(decoded.isChildRearingHousehold).toBe(input.isChildRearingHousehold);
    expect(decoded.currentRent).toBe(input.currentRent);
    expect(decoded.rentIncreaseRate).toBe(input.rentIncreaseRate);
    expect(decoded.prepayments).toEqual([]);
  });
});
