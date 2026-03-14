export type InterestType = "fixed" | "variable" | "flat35";
export type RepaymentMethod = "equal_payment" | "equal_principal";
export type PropertyType = "new" | "used";
export type BankType = "online" | "major";
export type EnergyPerformance = "certified" | "zeh" | "energy_standard" | "other";
export type PrepaymentType = "shorten_term" | "reduce_payment";

export interface PrepaymentInput {
  year: number;
  amount: number;
  type: PrepaymentType;
}

export interface LoanInput {
  propertyPrice: number;
  downPayment: number;
  propertyType: PropertyType;
  interestType: InterestType;
  interestRate: number;
  loanTermYears: number;
  repaymentMethod: RepaymentMethod;
  bonusPayment: number;
  bankType: BankType;
  maintenanceFee: number;
  repairReserve: number;
  propertyTax: number;
  energyPerformance: EnergyPerformance;
  isChildRearingHousehold: boolean;
  prepayments: PrepaymentInput[];
  currentRent?: number;
  rentIncreaseRate?: number;
}

export interface MonthlyScheduleItem {
  month: number;
  principal: number;
  interest: number;
  balance: number;
  payment: number;
}

export interface YearlyScheduleSummary {
  year: number;
  totalPrincipal: number;
  totalInterest: number;
  endBalance: number;
  averagePayment: number;
}

export interface VariableRateScenario {
  name: string;
  rate: number;
  monthlyPayment: number;
  totalRepayment: number;
  yearlySummary: YearlyScheduleSummary[];
}

export interface PrepaymentEffect {
  totalSaved: number;
  newTotalRepayment: number;
  shortenedMonths?: number;
  newMonthlyPayment?: number;
}

export interface TaxDeduction {
  borrowingLimit: number;
  yearlyDeductions: { year: number; amount: number; balance: number }[];
  totalDeduction: number;
  effectiveTotalRepayment: number;
}

export interface ClosingCostItem {
  name: string;
  amount: number;
  description: string;
}

export interface ClosingCosts {
  items: ClosingCostItem[];
  total: number;
  totalWithDownPayment: number;
}

export interface RentComparison {
  rentTotal: number;
  purchaseTotal: number;
  difference: number;
  breakEvenYear?: number;
}

export interface LoanResult {
  monthlyLoanPayment: number;
  totalMonthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  requiredIncome: Record<number, number>;
  schedule: MonthlyScheduleItem[];
  scenarios?: VariableRateScenario[];
  prepayment?: PrepaymentEffect;
  taxDeduction: TaxDeduction;
  closingCosts: ClosingCosts;
  rentComparison?: RentComparison;
}

export interface SavedPlan {
  id: string;
  name: string;
  input: LoanInput;
  result: LoanResult;
  createdAt: string;
}

export const DEFAULT_LOAN_INPUT: LoanInput = {
  propertyPrice: 3000,
  downPayment: 300,
  propertyType: "new",
  interestType: "fixed",
  interestRate: 1.5,
  loanTermYears: 35,
  repaymentMethod: "equal_payment",
  bonusPayment: 0,
  bankType: "online",
  maintenanceFee: 15000,  // 管理費
  repairReserve: 12000,   // 修繕積立金
  propertyTax: 10,
  energyPerformance: "energy_standard",
  isChildRearingHousehold: false,
  prepayments: [],
};
