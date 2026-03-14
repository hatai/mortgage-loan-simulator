# 住宅ローンシミュレーター Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 日本市場特化の住宅ローンシミュレーターを構築する。月々の支払額、必要年収、繰り上げ返済効果、住宅ローン控除、諸費用、賃貸比較を算出し、プラン保存・比較・URL共有・印刷機能を備える。

**Architecture:** TanStack Start (SSR + Server Functions) on Cloudflare Workers。計算ロジックはサーバーファンクション経由。UIは2カラム（入力|結果）。データ永続化はlocalStorage。チャートはRecharts。

**Tech Stack:** React 19, TanStack Start, TanStack Form, Zod, Recharts, Tailwind CSS v4, shadcn/ui, Vite+ (vp)

**Spec:** `docs/superpowers/specs/2026-03-14-mortgage-loan-simulator-design.md`

**Agent Team:** PM, PO, カスタマーサクセス, シニアエンジニア×2, フロントエンドエキスパート×2, バックエンドエキスパート×2

---

## Chunk 1: 基盤 — 型定義・計算ロジック・テスト

### Task 1: プロジェクトセットアップ

**Files:**

- Modify: `package.json` (add recharts)
- Modify: `src/routes/__root.tsx` (lang="ja", title)
- Create: `src/lib/types.ts`

**Context:** `vp add` を使ってrechartsをインストール。`vite`や`vitest`からではなく`vite-plus`からインポートすること。テストは `import { expect, test, describe } from 'vite-plus/test'` を使用。

- [ ] **Step 1: Install recharts**

```bash
vp add recharts
```

- [ ] **Step 2: Update root route for Japanese locale**

Modify `src/routes/__root.tsx`:

- Change `<html lang="en"` to `<html lang="ja"`
- Change title meta to `住宅ローンシミュレーター`

- [ ] **Step 3: Create type definitions**

Create `src/lib/types.ts` with all types from spec:

```typescript
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
  maintenanceFee: 12000,
  repairReserve: 15000,
  propertyTax: 10,
  energyPerformance: "energy_standard",
  isChildRearingHousehold: false,
  prepayments: [],
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/routes/__root.tsx package.json pnpm-lock.yaml
git commit -m "feat: add type definitions and install recharts"
```

---

### Task 2: コアローン計算ロジック（元利均等・元金均等）

**Files:**

- Create: `src/lib/loan-calculator.ts`
- Create: `src/lib/__tests__/loan-calculator.test.ts`

- [ ] **Step 1: Write failing tests for PMT calculation**

Create `src/lib/__tests__/loan-calculator.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import {
  calculateEqualPayment,
  calculateEqualPrincipal,
  generateSchedule,
  calculateWithBonus,
} from "../loan-calculator";

describe("calculateEqualPayment (元利均等)", () => {
  test("3000万円, 1.5%, 35年 → 月約91,855円", () => {
    const result = calculateEqualPayment(30_000_000, 1.5, 35);
    expect(result).toBeCloseTo(91855, -1);
  });

  test("2000万円, 0.5%, 35年 → 月約51,917円", () => {
    const result = calculateEqualPayment(20_000_000, 0.5, 35);
    expect(result).toBeCloseTo(51917, -1);
  });

  test("借入額0円 → 0円", () => {
    const result = calculateEqualPayment(0, 1.5, 35);
    expect(result).toBe(0);
  });
});

describe("calculateEqualPrincipal (元金均等)", () => {
  test("3000万円, 1.5%, 35年 → 初月の支払額", () => {
    const result = calculateEqualPrincipal(30_000_000, 1.5, 35, 1);
    const expectedPrincipal = 30_000_000 / (35 * 12);
    const expectedInterest = 30_000_000 * (1.5 / 100 / 12);
    expect(result).toBeCloseTo(expectedPrincipal + expectedInterest, 0);
  });

  test("最終月の利息はほぼ0", () => {
    const totalMonths = 35 * 12;
    const result = calculateEqualPrincipal(30_000_000, 1.5, 35, totalMonths);
    const expectedPrincipal = 30_000_000 / totalMonths;
    expect(result).toBeCloseTo(expectedPrincipal, -1);
  });
});

describe("generateSchedule", () => {
  test("元利均等で返済スケジュール生成 → 最終月残高がほぼ0", () => {
    const schedule = generateSchedule(30_000_000, 1.5, 35, "equal_payment");
    expect(schedule).toHaveLength(35 * 12);
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0);
  });

  test("元金均等で返済スケジュール生成 → 元金は毎月一定", () => {
    const schedule = generateSchedule(30_000_000, 1.5, 35, "equal_principal");
    const expectedPrincipal = 30_000_000 / (35 * 12);
    expect(schedule[0].principal).toBeCloseTo(expectedPrincipal, 0);
    expect(schedule[100].principal).toBeCloseTo(expectedPrincipal, 0);
  });
});

describe("calculateWithBonus (ボーナス返済)", () => {
  test("ボーナス返済ありの月々返済額が通常より少ない", () => {
    const withoutBonus = calculateEqualPayment(30_000_000, 1.5, 35);
    const withBonus = calculateWithBonus(30_000_000, 1.5, 35, 500_000);
    expect(withBonus.monthlyPayment).toBeLessThan(withoutBonus);
  });

  test("ボーナス月は追加支払いがある", () => {
    const result = calculateWithBonus(30_000_000, 1.5, 35, 500_000);
    expect(result.bonusMonthPayment).toBeGreaterThan(result.monthlyPayment);
  });

  test("ボーナス返済対象額が借入額の50%を超えない", () => {
    const result = calculateWithBonus(30_000_000, 1.5, 35, 20_000_000);
    expect(result.bonusPortionTotal).toBeLessThanOrEqual(15_000_000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/loan-calculator.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement loan calculator**

Create `src/lib/loan-calculator.ts`:

```typescript
import type { MonthlyScheduleItem, RepaymentMethod } from "./types";

export function calculateEqualPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  if (monthlyRate === 0) return principal / totalMonths;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
}

export function calculateEqualPrincipal(
  principal: number,
  annualRate: number,
  years: number,
  month: number,
): number {
  const totalMonths = years * 12;
  const monthlyPrincipal = principal / totalMonths;
  const monthlyRate = annualRate / 100 / 12;
  const remainingBalance = principal - monthlyPrincipal * (month - 1);
  const interest = remainingBalance * monthlyRate;
  return monthlyPrincipal + interest;
}

export function generateSchedule(
  principal: number,
  annualRate: number,
  years: number,
  method: RepaymentMethod,
): MonthlyScheduleItem[] {
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  const schedule: MonthlyScheduleItem[] = [];
  let balance = principal;

  if (method === "equal_payment") {
    const payment = calculateEqualPayment(principal, annualRate, years);
    for (let m = 1; m <= totalMonths; m++) {
      const interest = balance * monthlyRate;
      const princ = payment - interest;
      balance = Math.max(0, balance - princ);
      schedule.push({
        month: m,
        principal: princ,
        interest,
        balance,
        payment,
      });
    }
  } else {
    const monthlyPrincipal = principal / totalMonths;
    for (let m = 1; m <= totalMonths; m++) {
      const interest = balance * monthlyRate;
      const payment = monthlyPrincipal + interest;
      balance = Math.max(0, balance - monthlyPrincipal);
      schedule.push({
        month: m,
        principal: monthlyPrincipal,
        interest,
        balance,
        payment,
      });
    }
  }

  return schedule;
}

export function calculateWithBonus(
  principal: number,
  annualRate: number,
  years: number,
  bonusPaymentPerTime: number,
) {
  const maxBonusPortion = principal * 0.5;
  const totalBonusTimes = years * 2;
  const bonusPortionTotal = Math.min(bonusPaymentPerTime * totalBonusTimes, maxBonusPortion);
  const monthlyPortion = principal - bonusPortionTotal;

  const monthlyPayment = calculateEqualPayment(monthlyPortion, annualRate, years);

  const bonusMonthlyRate = annualRate / 100 / 12;
  const bonusTotalMonths = years * 12;
  const bonusPerMonth =
    bonusPortionTotal > 0 ? calculateEqualPayment(bonusPortionTotal, annualRate, years) : 0;

  const bonusExtra = bonusPerMonth * 6;
  const bonusMonthPayment = monthlyPayment + bonusExtra;

  return {
    monthlyPayment,
    bonusMonthPayment,
    bonusPortionTotal,
    monthlyPortion,
  };
}

export function scheduleToYearlySummary(schedule: MonthlyScheduleItem[]) {
  const years = Math.ceil(schedule.length / 12);
  return Array.from({ length: years }, (_, i) => {
    const yearMonths = schedule.slice(i * 12, (i + 1) * 12);
    return {
      year: i + 1,
      totalPrincipal: yearMonths.reduce((s, m) => s + m.principal, 0),
      totalInterest: yearMonths.reduce((s, m) => s + m.interest, 0),
      endBalance: yearMonths[yearMonths.length - 1]?.balance ?? 0,
      averagePayment: yearMonths.reduce((s, m) => s + m.payment, 0) / yearMonths.length,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
vp test run src/lib/__tests__/loan-calculator.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/loan-calculator.ts src/lib/__tests__/loan-calculator.test.ts
git commit -m "feat: implement core loan calculator with PMT, equal principal, bonus payment"
```

---

### Task 3: 変動金利シナリオ計算

**Files:**

- Modify: `src/lib/loan-calculator.ts` (add variable rate functions)
- Create: `src/lib/__tests__/variable-rate.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/variable-rate.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { calculateVariableRateScenarios } from "../loan-calculator";

describe("calculateVariableRateScenarios", () => {
  test("楽観シナリオは金利変動なし", () => {
    const scenarios = calculateVariableRateScenarios(30_000_000, 0.5, 35);
    const optimistic = scenarios.find((s) => s.name === "楽観")!;
    expect(optimistic.rate).toBe(0.5);
  });

  test("基準シナリオは5年ごとに+0.25%上昇", () => {
    const scenarios = calculateVariableRateScenarios(30_000_000, 0.5, 35);
    const base = scenarios.find((s) => s.name === "基準")!;
    expect(base.rate).toBe(0.5 + 0.25 * 7); // 35年 = 7回見直し
  });

  test("悲観シナリオは5年ごとに+0.5%上昇", () => {
    const scenarios = calculateVariableRateScenarios(30_000_000, 0.5, 35);
    const pessimistic = scenarios.find((s) => s.name === "悲観")!;
    expect(pessimistic.rate).toBe(0.5 + 0.5 * 7);
  });

  test("125%ルール: 返済額は前回の125%を超えない", () => {
    const scenarios = calculateVariableRateScenarios(30_000_000, 0.5, 35);
    const pessimistic = scenarios.find((s) => s.name === "悲観")!;
    for (let i = 1; i < pessimistic.yearlySummary.length; i++) {
      const prev5Year = pessimistic.yearlySummary[Math.max(0, Math.floor((i - 1) / 5) * 5)];
      if (i % 5 === 0) {
        expect(pessimistic.yearlySummary[i].averagePayment).toBeLessThanOrEqual(
          prev5Year.averagePayment * 1.25 + 1, // +1 for rounding
        );
      }
    }
  });

  test("年次サマリーの件数 = 返済年数", () => {
    const scenarios = calculateVariableRateScenarios(30_000_000, 0.5, 35);
    scenarios.forEach((s) => {
      expect(s.yearlySummary).toHaveLength(35);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/variable-rate.test.ts
```

- [ ] **Step 3: Implement variable rate scenarios**

Add to `src/lib/loan-calculator.ts`:

```typescript
import type { VariableRateScenario, YearlyScheduleSummary } from "./types";

interface ScenarioConfig {
  name: string;
  rateIncreasePerPeriod: number; // 5年ごとの金利上昇幅
}

const SCENARIO_CONFIGS: ScenarioConfig[] = [
  { name: "楽観", rateIncreasePerPeriod: 0 },
  { name: "基準", rateIncreasePerPeriod: 0.25 },
  { name: "悲観", rateIncreasePerPeriod: 0.5 },
];

export function calculateVariableRateScenarios(
  principal: number,
  initialRate: number,
  years: number,
  customRateIncreases?: number[],
): VariableRateScenario[] {
  const configs = customRateIncreases
    ? [{ name: "手動", rateIncreasePerPeriod: 0 }, ...SCENARIO_CONFIGS]
    : SCENARIO_CONFIGS;

  return configs
    .filter((c) => c.name !== "手動" || customRateIncreases)
    .map((config) => {
      const totalMonths = years * 12;
      const schedule: MonthlyScheduleItem[] = [];
      let balance = principal;
      let currentRate = initialRate;
      let currentPayment = calculateEqualPayment(principal, initialRate, years);
      let prevPeriodPayment = currentPayment;

      for (let m = 1; m <= totalMonths; m++) {
        const yearIndex = Math.floor((m - 1) / 12);
        const periodIndex = Math.floor(yearIndex / 5);

        // 5年ごとの金利見直し（5年ルール）
        if (m > 1 && (m - 1) % 60 === 0) {
          if (config.name === "手動" && customRateIncreases) {
            currentRate = initialRate + (customRateIncreases[periodIndex - 1] ?? 0);
          } else {
            currentRate = initialRate + config.rateIncreasePerPeriod * periodIndex;
          }

          const remainingMonths = totalMonths - m + 1;
          const newPayment = calculateEqualPayment(balance, currentRate, remainingMonths / 12);

          // 125%ルール
          const maxPayment = prevPeriodPayment * 1.25;
          currentPayment = Math.min(newPayment, maxPayment);
          prevPeriodPayment = currentPayment;
        }

        const monthlyRate = currentRate / 100 / 12;
        const interest = balance * monthlyRate;
        let princ = currentPayment - interest;

        // 未払い利息が発生する場合は元金に加算
        if (princ < 0) {
          balance += Math.abs(princ);
          princ = 0;
        }

        balance = Math.max(0, balance - princ);

        schedule.push({ month: m, principal: princ, interest, balance, payment: currentPayment });
      }

      const finalRate =
        config.name === "手動" && customRateIncreases
          ? initialRate + (customRateIncreases[customRateIncreases.length - 1] ?? 0)
          : initialRate + config.rateIncreasePerPeriod * Math.floor(years / 5);

      return {
        name: config.name,
        rate: finalRate,
        monthlyPayment: schedule[schedule.length - 1].payment,
        totalRepayment: schedule.reduce((s, m) => s + m.payment, 0),
        yearlySummary: scheduleToYearlySummary(schedule),
      };
    });
}
```

- [ ] **Step 4: Run tests**

```bash
vp test run src/lib/__tests__/variable-rate.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/loan-calculator.ts src/lib/__tests__/variable-rate.test.ts
git commit -m "feat: implement variable rate scenarios with 5-year and 125% rules"
```

---

### Task 4: 繰り上げ返済計算

**Files:**

- Create: `src/lib/prepayment-calculator.ts`
- Create: `src/lib/__tests__/prepayment-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/prepayment-calculator.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { calculatePrepaymentEffect } from "../prepayment-calculator";

describe("calculatePrepaymentEffect", () => {
  test("期間短縮型: 繰り上げ返済で期間が短縮される", () => {
    const result = calculatePrepaymentEffect(30_000_000, 1.5, 35, "equal_payment", [
      { year: 5, amount: 100, type: "shorten_term" },
    ]);
    expect(result.shortenedMonths).toBeGreaterThan(0);
    expect(result.totalSaved).toBeGreaterThan(0);
  });

  test("返済額軽減型: 月々の返済額が減少する", () => {
    const result = calculatePrepaymentEffect(30_000_000, 1.5, 35, "equal_payment", [
      { year: 5, amount: 100, type: "reduce_payment" },
    ]);
    expect(result.newMonthlyPayment).toBeDefined();
    expect(result.newMonthlyPayment!).toBeLessThan(
      result.newTotalRepayment / (35 * 12) + 1000, // less than average without prepay
    );
    expect(result.totalSaved).toBeGreaterThan(0);
  });

  test("複数回の繰り上げ返済", () => {
    const single = calculatePrepaymentEffect(30_000_000, 1.5, 35, "equal_payment", [
      { year: 5, amount: 100, type: "shorten_term" },
    ]);
    const multiple = calculatePrepaymentEffect(30_000_000, 1.5, 35, "equal_payment", [
      { year: 5, amount: 100, type: "shorten_term" },
      { year: 10, amount: 100, type: "shorten_term" },
    ]);
    expect(multiple.totalSaved).toBeGreaterThan(single.totalSaved);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/prepayment-calculator.test.ts
```

- [ ] **Step 3: Implement prepayment calculator**

Create `src/lib/prepayment-calculator.ts`:

```typescript
import type { PrepaymentEffect, PrepaymentInput, RepaymentMethod } from "./types";
import { calculateEqualPayment } from "./loan-calculator";

export function calculatePrepaymentEffect(
  principal: number,
  annualRate: number,
  years: number,
  method: RepaymentMethod,
  prepayments: PrepaymentInput[],
): PrepaymentEffect {
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  const originalPayment = calculateEqualPayment(principal, annualRate, years);
  const originalTotal = originalPayment * totalMonths;

  let balance = principal;
  let currentPayment = method === "equal_payment" ? originalPayment : 0;
  let totalPaid = 0;
  let actualMonths = 0;
  let lastNewPayment: number | undefined;

  const sortedPrepayments = [...prepayments].sort((a, b) => a.year - b.year);
  const prepaymentMonths = new Map(sortedPrepayments.map((p) => [p.year * 12, p]));

  for (let m = 1; m <= totalMonths; m++) {
    if (balance <= 0) break;

    // Check for prepayment at this month
    const prepay = prepaymentMonths.get(m);
    if (prepay) {
      const prepayAmount = prepay.amount * 10000; // 万円 → 円
      balance = Math.max(0, balance - prepayAmount);

      if (balance <= 0) {
        actualMonths = m;
        break;
      }

      if (prepay.type === "reduce_payment") {
        const remainingMonths = totalMonths - m;
        currentPayment = calculateEqualPayment(balance, annualRate, remainingMonths / 12);
        lastNewPayment = currentPayment;
      }
      // shorten_term: payment stays the same, period shortens naturally
    }

    if (method === "equal_principal") {
      const monthlyPrincipal = balance / (totalMonths - m + 1);
      const interest = balance * monthlyRate;
      currentPayment = monthlyPrincipal + interest;
    }

    const interest = balance * monthlyRate;
    const princ = Math.min(currentPayment - interest, balance);
    balance = Math.max(0, balance - princ);
    totalPaid += currentPayment;
    actualMonths = m;
  }

  const totalSaved = originalTotal - totalPaid;
  const shortenedMonths = totalMonths - actualMonths;

  return {
    totalSaved: Math.max(0, totalSaved),
    newTotalRepayment: totalPaid,
    shortenedMonths: shortenedMonths > 0 ? shortenedMonths : undefined,
    newMonthlyPayment: lastNewPayment,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
vp test run src/lib/__tests__/prepayment-calculator.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prepayment-calculator.ts src/lib/__tests__/prepayment-calculator.test.ts
git commit -m "feat: implement prepayment calculator with term shortening and payment reduction"
```

---

### Task 5: 住宅ローン控除計算

**Files:**

- Create: `src/lib/tax-deduction.ts`
- Create: `src/lib/__tests__/tax-deduction.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/tax-deduction.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { calculateTaxDeduction, getBorrowingLimit } from "../tax-deduction";

describe("getBorrowingLimit", () => {
  test("新築・認定住宅・一般世帯 → 4500万円", () => {
    expect(getBorrowingLimit("new", "certified", false)).toBe(45_000_000);
  });

  test("新築・認定住宅・子育て世帯 → 5000万円", () => {
    expect(getBorrowingLimit("new", "certified", true)).toBe(50_000_000);
  });

  test("新築・ZEH・一般世帯 → 3500万円", () => {
    expect(getBorrowingLimit("new", "zeh", false)).toBe(35_000_000);
  });

  test("新築・ZEH・子育て世帯 → 4500万円", () => {
    expect(getBorrowingLimit("new", "zeh", true)).toBe(45_000_000);
  });

  test("新築・省エネ基準・一般世帯 → 2000万円", () => {
    expect(getBorrowingLimit("new", "energy_standard", false)).toBe(20_000_000);
  });

  test("新築・省エネ基準・子育て世帯 → 3000万円", () => {
    expect(getBorrowingLimit("new", "energy_standard", true)).toBe(30_000_000);
  });

  test("既存・認定/ZEH・一般世帯 → 3500万円", () => {
    expect(getBorrowingLimit("used", "certified", false)).toBe(35_000_000);
    expect(getBorrowingLimit("used", "zeh", false)).toBe(35_000_000);
  });

  test("既存・その他・一般世帯 → 2000万円", () => {
    expect(getBorrowingLimit("used", "other", false)).toBe(20_000_000);
  });
});

describe("calculateTaxDeduction", () => {
  test("13年分の控除が生成される", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    expect(result.yearlyDeductions).toHaveLength(13);
  });

  test("控除額 = min(年末残高, 借入限度額) × 0.7%", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    const firstYear = result.yearlyDeductions[0];
    const expectedMax = Math.min(firstYear.balance, 45_000_000) * 0.007;
    expect(firstYear.amount).toBeCloseTo(expectedMax, 0);
  });

  test("借入額が限度額を超える場合、限度額で計算", () => {
    const result = calculateTaxDeduction(50_000_000, 1.5, 35, "new", "energy_standard", false);
    // 借入限度額2000万円 × 0.7% = 14万円が上限
    expect(result.yearlyDeductions[0].amount).toBeLessThanOrEqual(140_000);
  });

  test("控除総額が正の数", () => {
    const result = calculateTaxDeduction(30_000_000, 1.5, 35, "new", "certified", false);
    expect(result.totalDeduction).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/tax-deduction.test.ts
```

- [ ] **Step 3: Implement tax deduction calculator**

Create `src/lib/tax-deduction.ts`:

```typescript
import type { EnergyPerformance, PropertyType, TaxDeduction } from "./types";
import { generateSchedule } from "./loan-calculator";

// 2026年度税制改正ベース (令和8年度)
// ref: https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk2_000017.html
const BORROWING_LIMITS: Record<string, number> = {
  // 新築
  "new:certified:general": 45_000_000,
  "new:certified:child": 50_000_000,
  "new:zeh:general": 35_000_000,
  "new:zeh:child": 45_000_000,
  "new:energy_standard:general": 20_000_000,
  "new:energy_standard:child": 30_000_000,
  "new:other:general": 0, // 省エネ基準非適合の新築は対象外
  "new:other:child": 0,
  // 既存
  "used:certified:general": 35_000_000,
  "used:certified:child": 45_000_000,
  "used:zeh:general": 35_000_000,
  "used:zeh:child": 45_000_000,
  "used:energy_standard:general": 20_000_000,
  "used:energy_standard:child": 30_000_000,
  "used:other:general": 20_000_000,
  "used:other:child": 20_000_000,
};

const DEDUCTION_RATE = 0.007; // 0.7%
const DEDUCTION_YEARS = 13;

export function getBorrowingLimit(
  propertyType: PropertyType,
  energyPerformance: EnergyPerformance,
  isChildRearing: boolean,
): number {
  const household = isChildRearing ? "child" : "general";
  const key = `${propertyType}:${energyPerformance}:${household}`;
  return BORROWING_LIMITS[key] ?? 0;
}

export function calculateTaxDeduction(
  principal: number,
  annualRate: number,
  years: number,
  propertyType: PropertyType,
  energyPerformance: EnergyPerformance,
  isChildRearing: boolean,
): TaxDeduction {
  const borrowingLimit = getBorrowingLimit(propertyType, energyPerformance, isChildRearing);
  const schedule = generateSchedule(principal, annualRate, years, "equal_payment");

  const yearlyDeductions: TaxDeduction["yearlyDeductions"] = [];

  for (let y = 0; y < DEDUCTION_YEARS; y++) {
    const yearEndMonth = (y + 1) * 12;
    if (yearEndMonth > schedule.length) break;
    const yearEndBalance = schedule[yearEndMonth - 1].balance;
    const applicableBalance = Math.min(yearEndBalance, borrowingLimit);
    const amount = Math.floor(applicableBalance * DEDUCTION_RATE);

    yearlyDeductions.push({
      year: y + 1,
      amount,
      balance: yearEndBalance,
    });
  }

  const totalDeduction = yearlyDeductions.reduce((s, d) => s + d.amount, 0);
  const totalRepayment = schedule.reduce((s, m) => s + m.payment, 0);

  return {
    borrowingLimit,
    yearlyDeductions,
    totalDeduction,
    effectiveTotalRepayment: totalRepayment - totalDeduction,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
vp test run src/lib/__tests__/tax-deduction.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/tax-deduction.ts src/lib/__tests__/tax-deduction.test.ts
git commit -m "feat: implement tax deduction calculator based on 2026 tax reform"
```

---

### Task 6: 諸費用計算

**Files:**

- Create: `src/lib/closing-costs.ts`
- Create: `src/lib/__tests__/closing-costs.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/closing-costs.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { calculateClosingCosts } from "../closing-costs";

describe("calculateClosingCosts", () => {
  test("新築の場合、仲介手数料なし", () => {
    const result = calculateClosingCosts(3000, 2700, "new", "online");
    const brokerage = result.items.find((i) => i.name === "仲介手数料");
    expect(brokerage?.amount).toBe(0);
  });

  test("中古の場合、仲介手数料あり", () => {
    const result = calculateClosingCosts(3000, 2700, "used", "online");
    const brokerage = result.items.find((i) => i.name === "仲介手数料");
    // 3000万 × 3% + 6万 + 消費税 = (90 + 6) × 1.1 = 105.6万
    expect(brokerage!.amount).toBeCloseTo(1_056_000, -3);
  });

  test("ネット銀行の事務手数料 = 借入額 × 2.2%", () => {
    const result = calculateClosingCosts(3000, 2700, "new", "online");
    const fee = result.items.find((i) => i.name === "ローン事務手数料");
    expect(fee!.amount).toBeCloseTo(27_000_000 * 0.022, -3);
  });

  test("都市銀行の事務手数料は定額", () => {
    const result = calculateClosingCosts(3000, 2700, "new", "major");
    const fee = result.items.find((i) => i.name === "ローン事務手数料");
    expect(fee!.amount).toBeLessThanOrEqual(55_000); // 3〜5万円
  });

  test("合計が正の数", () => {
    const result = calculateClosingCosts(3000, 2700, "new", "online");
    expect(result.total).toBeGreaterThan(0);
  });

  test("totalWithDownPayment = 頭金 + 諸費用合計", () => {
    // propertyPrice=3000万, principal=2700万 → downPayment=300万
    const result = calculateClosingCosts(3000, 2700, "new", "online");
    // 関数内でdownPayment = (3000-2700)*10000 = 3,000,000
    expect(result.totalWithDownPayment).toBe(3_000_000 + result.total);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/closing-costs.test.ts
```

- [ ] **Step 3: Implement closing costs calculator**

Create `src/lib/closing-costs.ts`:

```typescript
import type { BankType, ClosingCosts, PropertyType } from "./types";

function getStampDuty(loanAmount: number): number {
  if (loanAmount <= 1_000_000) return 200;
  if (loanAmount <= 5_000_000) return 2_000;
  if (loanAmount <= 10_000_000) return 10_000;
  if (loanAmount <= 50_000_000) return 20_000;
  if (loanAmount <= 100_000_000) return 60_000;
  return 100_000;
}

export function calculateClosingCosts(
  propertyPriceMan: number,
  principalMan: number,
  propertyType: PropertyType,
  bankType: BankType,
): ClosingCosts {
  const propertyPrice = propertyPriceMan * 10_000;
  const principal = principalMan * 10_000;
  const downPayment = propertyPrice - principal;

  const items = [];

  // 仲介手数料（中古のみ）
  const brokerage = propertyType === "used" ? Math.floor((propertyPrice * 0.03 + 60_000) * 1.1) : 0;
  items.push({
    name: "仲介手数料",
    amount: brokerage,
    description: propertyType === "used" ? "物件価格×3%+6万円+消費税" : "新築のため不要",
  });

  // 登録免許税
  const assessedValue = propertyPrice * 0.7;
  const ownershipTax = Math.floor(assessedValue * 0.004);
  const mortgageTax = Math.floor(principal * 0.001);
  items.push({
    name: "登録免許税",
    amount: ownershipTax + mortgageTax,
    description: "所有権移転+抵当権設定",
  });

  // 司法書士報酬
  items.push({ name: "司法書士報酬", amount: 100_000, description: "概算" });

  // 印紙税
  items.push({
    name: "印紙税",
    amount: getStampDuty(principal),
    description: "借入額に応じた税額",
  });

  // 火災保険料
  items.push({ name: "火災保険料", amount: 200_000, description: "概算（10年一括）" });

  // ローン事務手数料
  const loanFee = bankType === "online" ? Math.floor(principal * 0.022) : 44_000;
  items.push({
    name: "ローン事務手数料",
    amount: loanFee,
    description: bankType === "online" ? "借入額×2.2%" : "定額（税込）",
  });

  // 保証料
  const guaranteeFee = Math.floor(principal * 0.02);
  items.push({ name: "保証料", amount: guaranteeFee, description: "借入額×2%（概算）" });

  const total = items.reduce((s, i) => s + i.amount, 0);

  return {
    items,
    total,
    totalWithDownPayment: downPayment + total,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
vp test run src/lib/__tests__/closing-costs.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/closing-costs.ts src/lib/__tests__/closing-costs.test.ts
git commit -m "feat: implement closing costs calculator"
```

---

### Task 7: 賃貸比較計算

**Files:**

- Create: `src/lib/rent-comparison.ts`
- Create: `src/lib/__tests__/rent-comparison.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/rent-comparison.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { calculateRentComparison } from "../rent-comparison";

describe("calculateRentComparison", () => {
  test("家賃上昇率0%の場合、単純な掛け算", () => {
    const result = calculateRentComparison(100_000, 0, 35, 50_000_000, 0);
    expect(result.rentTotal).toBe(100_000 * 12 * 35);
  });

  test("家賃上昇率考慮で賃貸総額が増える", () => {
    const noIncrease = calculateRentComparison(100_000, 0, 35, 50_000_000, 0);
    const withIncrease = calculateRentComparison(100_000, 0.5, 35, 50_000_000, 0);
    expect(withIncrease.rentTotal).toBeGreaterThan(noIncrease.rentTotal);
  });

  test("差額が正 = 購入が安い", () => {
    const result = calculateRentComparison(200_000, 1, 35, 40_000_000, 3_000_000);
    // 家賃20万×12×35年(+上昇)はかなり高い → 購入が安い可能性
    expect(result.difference).toBeDefined();
  });

  test("損益分岐年の計算", () => {
    const result = calculateRentComparison(120_000, 0.5, 35, 50_000_000, 2_000_000);
    if (result.breakEvenYear !== undefined) {
      expect(result.breakEvenYear).toBeGreaterThan(0);
      expect(result.breakEvenYear).toBeLessThanOrEqual(35);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/rent-comparison.test.ts
```

- [ ] **Step 3: Implement rent comparison**

Create `src/lib/rent-comparison.ts`:

```typescript
import type { RentComparison } from "./types";

export function calculateRentComparison(
  monthlyRent: number,
  annualIncreaseRate: number,
  years: number,
  purchaseTotal: number,
  taxDeductionTotal: number,
): RentComparison {
  let rentTotal = 0;
  let breakEvenYear: number | undefined;

  // purchaseTotal already includes downPayment + closingCosts + totalRepayment + maintenance
  const purchaseGrandTotal = purchaseTotal - taxDeductionTotal;

  let currentRent = monthlyRent;
  let runningRentTotal = 0;

  for (let y = 1; y <= years; y++) {
    const yearlyRent = currentRent * 12;
    runningRentTotal += yearlyRent;
    currentRent = currentRent * (1 + annualIncreaseRate / 100);

    // 損益分岐年: 賃貸累計が購入総額を超えた年
    if (breakEvenYear === undefined && runningRentTotal >= purchaseGrandTotal) {
      breakEvenYear = y;
    }
  }

  rentTotal = runningRentTotal;

  return {
    rentTotal,
    purchaseTotal: purchaseGrandTotal,
    difference: rentTotal - purchaseGrandTotal,
    breakEvenYear,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
vp test run src/lib/__tests__/rent-comparison.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/rent-comparison.ts src/lib/__tests__/rent-comparison.test.ts
git commit -m "feat: implement rent vs purchase comparison calculator"
```

---

### Task 8: URL共有パラメータ変換

**Files:**

- Create: `src/lib/url-params.ts`
- Create: `src/lib/__tests__/url-params.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/url-params.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { encodeParams, decodeParams } from "../url-params";
import type { LoanInput } from "../types";
import { DEFAULT_LOAN_INPUT } from "../types";

describe("URL params", () => {
  test("encode → decode の往復一致", () => {
    const input: LoanInput = { ...DEFAULT_LOAN_INPUT, propertyPrice: 4000, interestRate: 1.2 };
    const encoded = encodeParams(input);
    const decoded = decodeParams(encoded);
    expect(decoded.propertyPrice).toBe(4000);
    expect(decoded.interestRate).toBe(1.2);
  });

  test("デフォルト値はクエリに含めない（短縮）", () => {
    const encoded = encodeParams(DEFAULT_LOAN_INPUT);
    expect(encoded).toBe("");
  });

  test("空文字列のデコードはデフォルト値を返す", () => {
    const decoded = decodeParams("");
    expect(decoded.propertyPrice).toBe(DEFAULT_LOAN_INPUT.propertyPrice);
  });

  test("不正な値はデフォルト値にフォールバック", () => {
    const decoded = decodeParams("p=abc&r=-1");
    expect(decoded.propertyPrice).toBe(DEFAULT_LOAN_INPUT.propertyPrice);
    expect(decoded.interestRate).toBe(DEFAULT_LOAN_INPUT.interestRate);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/url-params.test.ts
```

- [ ] **Step 3: Implement URL params**

Create `src/lib/url-params.ts`:

```typescript
import type { LoanInput } from "./types";
import { DEFAULT_LOAN_INPUT } from "./types";

const PARAM_MAP = {
  p: "propertyPrice",
  d: "downPayment",
  t: "interestType",
  r: "interestRate",
  y: "loanTermYears",
  m: "repaymentMethod",
  b: "bonusPayment",
  mf: "maintenanceFee",
  rr: "repairReserve",
  pt: "propertyTax",
  ptype: "propertyType",
  bank: "bankType",
  ep: "energyPerformance",
  child: "isChildRearingHousehold",
  rent: "currentRent",
  ri: "rentIncreaseRate",
} as const;

type ParamKey = keyof typeof PARAM_MAP;

const REVERSE_MAP = Object.fromEntries(Object.entries(PARAM_MAP).map(([k, v]) => [v, k])) as Record<
  string,
  ParamKey
>;

const NUMBER_FIELDS = new Set([
  "propertyPrice",
  "downPayment",
  "interestRate",
  "loanTermYears",
  "bonusPayment",
  "maintenanceFee",
  "repairReserve",
  "propertyTax",
  "currentRent",
  "rentIncreaseRate",
]);

export function encodeParams(input: LoanInput): string {
  const params = new URLSearchParams();

  for (const [field, paramKey] of Object.entries(REVERSE_MAP)) {
    const value = input[field as keyof LoanInput];
    const defaultValue = DEFAULT_LOAN_INPUT[field as keyof LoanInput];

    if (value === defaultValue || value === undefined) continue;
    if (field === "prepayments") continue; // prepayments excluded from URL sharing
    if (field === "isChildRearingHousehold") {
      if (value) params.set(paramKey, "1");
      continue;
    }

    params.set(paramKey, String(value));
  }

  return params.toString();
}

export function decodeParams(queryString: string): LoanInput {
  const params = new URLSearchParams(queryString);
  const result = { ...DEFAULT_LOAN_INPUT };

  for (const [paramKey, field] of Object.entries(PARAM_MAP)) {
    const raw = params.get(paramKey);
    if (raw === null) continue;

    if (field === "isChildRearingHousehold") {
      (result as any)[field] = raw === "1";
      continue;
    }

    if (NUMBER_FIELDS.has(field)) {
      const num = Number(raw);
      if (!Number.isNaN(num) && num >= 0) {
        (result as any)[field] = num;
      }
    } else {
      (result as any)[field] = raw;
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests**

```bash
vp test run src/lib/__tests__/url-params.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/url-params.ts src/lib/__tests__/url-params.test.ts
git commit -m "feat: implement URL parameter encoding/decoding for sharing"
```

---

### Task 9: 用語辞書データ

**Files:**

- Create: `src/lib/glossary.ts`

- [ ] **Step 1: Create glossary data**

Create `src/lib/glossary.ts`:

```typescript
export interface GlossaryEntry {
  term: string;
  description: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  equal_payment: {
    term: "元利均等返済",
    description:
      "毎月の返済額（元金＋利息）が一定になる返済方式。返済計画が立てやすいのが特徴。初期は利息の割合が大きく、徐々に元金の割合が増えていきます。",
  },
  equal_principal: {
    term: "元金均等返済",
    description:
      "毎月の元金返済額が一定で、利息が徐々に減っていく返済方式。初期の返済額は高いですが、総返済額は元利均等より少なくなります。",
  },
  flat35: {
    term: "フラット35",
    description:
      "住宅金融支援機構と民間金融機関が提携して提供する、最長35年の全期間固定金利住宅ローン。金利変動リスクがなく、返済額が最後まで変わりません。",
  },
  variable_rate: {
    term: "変動金利",
    description:
      "市場金利の動きに連動して適用金利が変わるタイプ。固定金利より低い金利で始められますが、将来の金利上昇リスクがあります。",
  },
  fixed_rate: {
    term: "固定金利",
    description:
      "借入時に決めた金利が返済期間中ずっと変わらないタイプ。返済額が一定で計画を立てやすいですが、変動金利より金利が高い傾向があります。",
  },
  repair_reserve: {
    term: "修繕積立金",
    description:
      "マンションの大規模修繕工事に備えて毎月積み立てるお金。築年数が経つと値上がりすることが多いです。",
  },
  maintenance_fee: {
    term: "管理費",
    description:
      "マンションの共用部分の維持管理に使われる毎月の費用。エレベーター保守、清掃、管理人の人件費などが含まれます。",
  },
  repayment_ratio: {
    term: "返済比率",
    description:
      "年収に対するローン返済額の割合。一般的に25%以下が適正とされ、30%を超えると家計に負担がかかる可能性があります。",
  },
  prepayment_shorten: {
    term: "期間短縮型（繰り上げ返済）",
    description:
      "繰り上げ返済した分、返済期間を短くする方式。利息軽減効果が大きく、早期完済を目指す場合におすすめです。",
  },
  prepayment_reduce: {
    term: "返済額軽減型（繰り上げ返済）",
    description:
      "繰り上げ返済した分、毎月の返済額を減らす方式。期間短縮型より利息軽減効果は小さいですが、月々の負担を軽減できます。",
  },
  tax_deduction: {
    term: "住宅ローン控除",
    description:
      "住宅ローンを利用して住宅を購入した場合に、年末ローン残高の0.7%が13年間にわたり所得税・住民税から控除される制度（2026年度税制改正ベース）。",
  },
  five_year_rule: {
    term: "5年ルール",
    description:
      "変動金利の月々返済額は5年間固定される仕組み。金利が上昇しても、次の見直し時期までは返済額が変わりません。",
  },
  cap_125: {
    term: "125%ルール",
    description:
      "5年ごとの返済額見直し時、新しい返済額は前回の125%（1.25倍）が上限とされる仕組み。急激な返済額の増加を防ぎます。",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/glossary.ts
git commit -m "feat: add mortgage glossary data for tooltips"
```

---

### Task 10: Zodバリデーション & サーバーファンクション

**Files:**

- Create: `src/server/validation.ts`
- Create: `src/server/calculate.ts`
- Create: `src/lib/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing tests for validation**

Create `src/lib/__tests__/validation.test.ts`:

```typescript
import { describe, expect, test } from "vite-plus/test";
import { loanInputSchema } from "../../server/validation";

describe("loanInputSchema", () => {
  test("デフォルト値で通る", () => {
    const result = loanInputSchema.safeParse({
      propertyPrice: 3000,
      downPayment: 300,
      propertyType: "new",
      interestType: "fixed",
      interestRate: 1.5,
      loanTermYears: 35,
      repaymentMethod: "equal_payment",
      bonusPayment: 0,
      bankType: "online",
      maintenanceFee: 12000,
      repairReserve: 15000,
      propertyTax: 10,
      energyPerformance: "energy_standard",
      isChildRearingHousehold: false,
      prepayments: [],
    });
    expect(result.success).toBe(true);
  });

  test("物件価格が100万円未満でエラー", () => {
    const result = loanInputSchema.safeParse({
      propertyPrice: 50,
      downPayment: 0,
      propertyType: "new",
      interestType: "fixed",
      interestRate: 1.5,
      loanTermYears: 35,
      repaymentMethod: "equal_payment",
      bonusPayment: 0,
      bankType: "online",
      maintenanceFee: 12000,
      repairReserve: 15000,
      propertyTax: 10,
      energyPerformance: "energy_standard",
      isChildRearingHousehold: false,
      prepayments: [],
    });
    expect(result.success).toBe(false);
  });

  test("金利0%でエラー", () => {
    const result = loanInputSchema.safeParse({
      propertyPrice: 3000,
      downPayment: 300,
      propertyType: "new",
      interestType: "fixed",
      interestRate: 0,
      loanTermYears: 35,
      repaymentMethod: "equal_payment",
      bonusPayment: 0,
      bankType: "online",
      maintenanceFee: 12000,
      repairReserve: 15000,
      propertyTax: 10,
      energyPerformance: "energy_standard",
      isChildRearingHousehold: false,
      prepayments: [],
    });
    expect(result.success).toBe(false);
  });

  test("繰り上げ返済は最大5件", () => {
    const prepayments = Array.from({ length: 6 }, (_, i) => ({
      year: i + 1,
      amount: 100,
      type: "shorten_term" as const,
    }));
    const result = loanInputSchema.safeParse({
      propertyPrice: 3000,
      downPayment: 300,
      propertyType: "new",
      interestType: "fixed",
      interestRate: 1.5,
      loanTermYears: 35,
      repaymentMethod: "equal_payment",
      bonusPayment: 0,
      bankType: "online",
      maintenanceFee: 12000,
      repairReserve: 15000,
      propertyTax: 10,
      energyPerformance: "energy_standard",
      isChildRearingHousehold: false,
      prepayments,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
vp test run src/lib/__tests__/validation.test.ts
```

- [ ] **Step 3: Implement validation schema**

Create `src/server/validation.ts`:

```typescript
import { z } from "zod";

const prepaymentInputSchema = z.object({
  year: z.number().min(1),
  amount: z.number().min(1),
  type: z.enum(["shorten_term", "reduce_payment"]),
});

export const loanInputSchema = z
  .object({
    propertyPrice: z.number().min(100).max(50000),
    downPayment: z.number().min(0),
    propertyType: z.enum(["new", "used"]),
    interestType: z.enum(["fixed", "variable", "flat35"]),
    interestRate: z.number().gt(0).max(15),
    loanTermYears: z.number().min(1).max(50),
    repaymentMethod: z.enum(["equal_payment", "equal_principal"]),
    bonusPayment: z.number().min(0),
    bankType: z.enum(["online", "major"]),
    maintenanceFee: z.number().min(0).max(100000),
    repairReserve: z.number().min(0).max(100000),
    propertyTax: z.number().min(0).max(100),
    energyPerformance: z.enum(["certified", "zeh", "energy_standard", "other"]),
    isChildRearingHousehold: z.boolean(),
    prepayments: z.array(prepaymentInputSchema).max(5),
    currentRent: z.number().min(0).max(500000).optional(),
    rentIncreaseRate: z.number().min(0).max(5).optional(),
  })
  .refine((data) => data.downPayment <= data.propertyPrice, {
    message: "頭金は物件価格以下にしてください",
    path: ["downPayment"],
  });
```

- [ ] **Step 4: Implement server function**

Create `src/server/calculate.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { loanInputSchema } from "./validation";
import {
  calculateEqualPayment,
  calculateWithBonus,
  generateSchedule,
  scheduleToYearlySummary,
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
    const principal = (data.propertyPrice - data.downPayment) * 10_000; // 万円→円

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
      data.propertyPrice - data.downPayment,
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
```

- [ ] **Step 5: Run validation tests**

```bash
vp test run src/lib/__tests__/validation.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/server/validation.ts src/server/calculate.ts src/lib/__tests__/validation.test.ts
git commit -m "feat: add Zod validation schema and server function for loan calculation"
```

---

### Task 11: プラン保存 (localStorage) & Hook

**Files:**

- Create: `src/lib/plans-storage.ts`
- Create: `src/hooks/use-plans.ts`

- [ ] **Step 1: Implement plans storage**

Create `src/lib/plans-storage.ts`:

```typescript
import type { SavedPlan } from "./types";

const STORAGE_KEY = "mortgage-simulator-plans";

export function loadPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function savePlan(plan: SavedPlan): void {
  const plans = loadPlans();
  plans.push(plan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function deletePlan(id: string): void {
  const plans = loadPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function renamePlan(id: string, name: string): void {
  const plans = loadPlans().map((p) => (p.id === id ? { ...p, name } : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
```

- [ ] **Step 2: Implement use-plans hook**

Create `src/hooks/use-plans.ts`:

```typescript
import { useCallback, useSyncExternalStore } from "react";
import type { LoanInput, LoanResult, SavedPlan } from "../lib/types";
import {
  loadPlans,
  savePlan as storageSave,
  deletePlan as storageDelete,
  renamePlan as storageRename,
  generatePlanId,
} from "../lib/plans-storage";

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedPlans: SavedPlan[] = [];

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  cachedRaw = null; // invalidate cache
  listeners.forEach((cb) => cb());
}

function getSnapshot(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("mortgage-simulator-plans");
  if (raw === cachedRaw) return cachedPlans;
  cachedRaw = raw;
  cachedPlans = raw ? JSON.parse(raw) : [];
  return cachedPlans;
}

function getServerSnapshot(): SavedPlan[] {
  return [];
}

export function usePlans() {
  const plans = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((name: string, input: LoanInput, result: LoanResult) => {
    const plan: SavedPlan = {
      id: generatePlanId(),
      name,
      input,
      result,
      createdAt: new Date().toISOString(),
    };
    storageSave(plan);
    notify();
    return plan;
  }, []);

  const remove = useCallback((id: string) => {
    storageDelete(id);
    notify();
  }, []);

  const rename = useCallback((id: string, name: string) => {
    storageRename(id, name);
    notify();
  }, []);

  return { plans, save, remove, rename };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/plans-storage.ts src/hooks/use-plans.ts
git commit -m "feat: add localStorage plans storage and usePlans hook"
```

---

## Chunk 2: UI — 入力パネル・結果パネル・ルート統合

> このチャンクは別途記述します。以下が含まれます:
>
> - Task 12: InputPanel系コンポーネント (PropertySection, LoanSection, MaintenanceSection, PrepaymentSection, RentComparisonInput, CalculateButton)
> - Task 13: ResultPanel系コンポーネント (SummaryCard, PaymentBreakdownChart, RepaymentScheduleChart, IncomeGuideline, PrepaymentResult, TaxDeductionSection, ClosingCostsSection, RentComparisonChart)
> - Task 14: 共有コンポーネント (Tooltip, SavePlanBar)
> - Task 15: メインページ統合 (index.tsx — 2カラムレイアウト)
> - Task 16: Header更新 & ルーティング

## Chunk 3: 追加ページ・付加機能

> このチャンクは別途記述します。以下が含まれます:
>
> - Task 17: /plans ページ (プラン一覧)
> - Task 18: /compare ページ (プラン比較テーブル)
> - Task 19: 印刷スタイル (print.css)
> - Task 20: 不要ファイル削除 (デモページ・aboutページ等)

## Chunk 4: エージェントチームレビュー

> このチャンクは別途記述します。以下が含まれます:
>
> - Task 21: PM/POレビュー
> - Task 22: カスタマーサクセスレビュー
> - Task 23: シニアエンジニアレビュー (コード品質・テスト)
> - Task 24: 全テスト実行 & ビルド確認
