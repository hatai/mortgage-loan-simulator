import type {
  LoanInput,
  InterestType,
  RepaymentMethod,
  PropertyType,
  BankType,
  EnergyPerformance,
} from "./types";
import { DEFAULT_LOAN_INPUT } from "./types";

const VALID_INTEREST_TYPES: InterestType[] = ["fixed", "variable", "flat35"];
const VALID_REPAYMENT_METHODS: RepaymentMethod[] = ["equal_payment", "equal_principal"];
const VALID_PROPERTY_TYPES: PropertyType[] = ["new", "used"];
const VALID_BANK_TYPES: BankType[] = ["online", "major"];
const VALID_ENERGY_PERFORMANCES: EnergyPerformance[] = [
  "certified",
  "zeh",
  "energy_standard",
  "other",
];

/**
 * Encode LoanInput to a URL query string, skipping values equal to DEFAULT_LOAN_INPUT.
 * Prepayments are never encoded.
 */
export function encodeParams(input: LoanInput): string {
  const params = new URLSearchParams();

  if (input.propertyPrice !== DEFAULT_LOAN_INPUT.propertyPrice) {
    params.set("p", String(input.propertyPrice));
  }
  if (input.downPayment !== DEFAULT_LOAN_INPUT.downPayment) {
    params.set("d", String(input.downPayment));
  }
  if (input.interestType !== DEFAULT_LOAN_INPUT.interestType) {
    params.set("t", input.interestType);
  }
  if (input.interestRate !== DEFAULT_LOAN_INPUT.interestRate) {
    params.set("r", String(input.interestRate));
  }
  if (input.loanTermYears !== DEFAULT_LOAN_INPUT.loanTermYears) {
    params.set("y", String(input.loanTermYears));
  }
  if (input.repaymentMethod !== DEFAULT_LOAN_INPUT.repaymentMethod) {
    params.set("m", input.repaymentMethod);
  }
  if (input.bonusPayment !== DEFAULT_LOAN_INPUT.bonusPayment) {
    params.set("b", String(input.bonusPayment));
  }
  if (input.maintenanceFee !== DEFAULT_LOAN_INPUT.maintenanceFee) {
    params.set("mf", String(input.maintenanceFee));
  }
  if (input.repairReserve !== DEFAULT_LOAN_INPUT.repairReserve) {
    params.set("rr", String(input.repairReserve));
  }
  if (input.propertyTax !== DEFAULT_LOAN_INPUT.propertyTax) {
    params.set("pt", String(input.propertyTax));
  }
  if (input.propertyType !== DEFAULT_LOAN_INPUT.propertyType) {
    params.set("ptype", input.propertyType);
  }
  if (input.bankType !== DEFAULT_LOAN_INPUT.bankType) {
    params.set("bank", input.bankType);
  }
  if (input.energyPerformance !== DEFAULT_LOAN_INPUT.energyPerformance) {
    params.set("ep", input.energyPerformance);
  }
  if (input.isChildRearingHousehold !== DEFAULT_LOAN_INPUT.isChildRearingHousehold) {
    params.set("child", input.isChildRearingHousehold ? "1" : "0");
  }
  if (input.currentRent !== undefined && input.currentRent !== DEFAULT_LOAN_INPUT.currentRent) {
    params.set("rent", String(input.currentRent));
  }
  if (
    input.rentIncreaseRate !== undefined &&
    input.rentIncreaseRate !== DEFAULT_LOAN_INPUT.rentIncreaseRate
  ) {
    params.set("ri", String(input.rentIncreaseRate));
  }

  return params.toString();
}

/**
 * Decode a URL query string to LoanInput, falling back to defaults for missing or invalid values.
 * Prepayments are always returned as an empty array.
 */
export function decodeParams(queryString: string): LoanInput {
  const params = new URLSearchParams(queryString);

  const parseNumber = (
    key: string,
    defaultValue: number,
    min = 0,
    max = Infinity,
  ): number => {
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) return defaultValue;
    return parsed;
  };

  const parseEnum = <T extends string>(key: string, valid: T[], defaultValue: T): T => {
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    return valid.includes(raw as T) ? (raw as T) : defaultValue;
  };

  const parseBoolean = (key: string, defaultValue: boolean): boolean => {
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    if (raw === "1") return true;
    if (raw === "0") return false;
    return defaultValue;
  };

  const parseOptionalNumber = (key: string, min = 0, max = Infinity): number | undefined => {
    const raw = params.get(key);
    if (raw === null) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined;
    return parsed;
  };

  return {
    propertyPrice: parseNumber("p", DEFAULT_LOAN_INPUT.propertyPrice, 100, 50000),
    downPayment: parseNumber("d", DEFAULT_LOAN_INPUT.downPayment, 0, 50000),
    interestType: parseEnum("t", VALID_INTEREST_TYPES, DEFAULT_LOAN_INPUT.interestType),
    interestRate: parseNumber("r", DEFAULT_LOAN_INPUT.interestRate, 0.01, 15),
    loanTermYears: parseNumber("y", DEFAULT_LOAN_INPUT.loanTermYears, 1, 50),
    repaymentMethod: parseEnum("m", VALID_REPAYMENT_METHODS, DEFAULT_LOAN_INPUT.repaymentMethod),
    bonusPayment: parseNumber("b", DEFAULT_LOAN_INPUT.bonusPayment, 0, 50000),
    maintenanceFee: parseNumber("mf", DEFAULT_LOAN_INPUT.maintenanceFee, 0, 100000),
    repairReserve: parseNumber("rr", DEFAULT_LOAN_INPUT.repairReserve, 0, 100000),
    propertyTax: parseNumber("pt", DEFAULT_LOAN_INPUT.propertyTax, 0, 100),
    propertyType: parseEnum("ptype", VALID_PROPERTY_TYPES, DEFAULT_LOAN_INPUT.propertyType),
    bankType: parseEnum("bank", VALID_BANK_TYPES, DEFAULT_LOAN_INPUT.bankType),
    energyPerformance: parseEnum(
      "ep",
      VALID_ENERGY_PERFORMANCES,
      DEFAULT_LOAN_INPUT.energyPerformance,
    ),
    isChildRearingHousehold: parseBoolean("child", DEFAULT_LOAN_INPUT.isChildRearingHousehold),
    currentRent: parseOptionalNumber("rent", 0, 500000),
    rentIncreaseRate: parseOptionalNumber("ri", 0, 5),
    prepayments: [],
  };
}
