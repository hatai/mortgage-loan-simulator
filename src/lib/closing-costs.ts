import type { BankType, ClosingCostItem, ClosingCosts, PropertyType } from "./types";

/**
 * Calculate stamp duty (印紙税) based on loan principal amount in yen.
 */
function calculateStampDuty(principalYen: number): number {
  if (principalYen <= 1_000_000) return 200;
  if (principalYen <= 5_000_000) return 2_000;
  if (principalYen <= 10_000_000) return 10_000;
  if (principalYen <= 50_000_000) return 20_000;
  if (principalYen <= 100_000_000) return 60_000;
  return 100_000;
}

/**
 * Calculate closing costs (諸費用) for a mortgage loan.
 *
 * @param propertyPriceMan - Property price in 万円
 * @param principalMan - Loan principal in 万円
 * @param propertyType - 'new' (新築) or 'used' (中古)
 * @param bankType - 'online' (ネット銀行) or 'major' (メガバンク)
 * @returns ClosingCosts object with itemized costs, total, and total with down payment
 */
export function calculateClosingCosts(
  propertyPriceMan: number,
  principalMan: number,
  propertyType: PropertyType,
  bankType: BankType,
): ClosingCosts {
  const propertyPriceYen = propertyPriceMan * 10_000;
  const principalYen = principalMan * 10_000;
  const downPayment = (propertyPriceMan - principalMan) * 10_000;

  // 仲介手数料: only for used properties
  const agentFee = propertyType === "used" ? (propertyPriceYen * 0.03 + 60_000) * 1.1 : 0;

  // 登録免許税
  const assessedValue = propertyPriceYen * 0.7;
  const ownershipTax = assessedValue * 0.004;
  const mortgageTax = principalYen * 0.001;
  const registrationTax = ownershipTax + mortgageTax;

  // 司法書士報酬: fixed
  const judicialScrivenerFee = 100_000;

  // 印紙税: tiered by principal amount
  const stampDuty = calculateStampDuty(principalYen);

  // 火災保険料: fixed
  const fireInsurance = 200_000;

  // ローン事務手数料
  const loanAdminFee = bankType === "online" ? principalYen * 0.022 : 44_000;

  // 保証料
  const guaranteeFee = principalYen * 0.02;

  const items: ClosingCostItem[] = [
    {
      name: "仲介手数料",
      amount: agentFee,
      description:
        propertyType === "used"
          ? "物件価格×3%+6万円（税込）。中古物件の場合に発生します。"
          : "新築物件のため仲介手数料は不要です。",
    },
    {
      name: "登録免許税",
      amount: registrationTax,
      description: "所有権移転登記（固定資産税評価額×0.4%）＋抵当権設定登記（借入金額×0.1%）",
    },
    {
      name: "司法書士報酬",
      amount: judicialScrivenerFee,
      description: "登記手続きを代行する司法書士への報酬（目安）",
    },
    {
      name: "印紙税",
      amount: stampDuty,
      description: "金銭消費貸借契約書に貼付する印紙代（借入金額に応じた段階税率）",
    },
    {
      name: "火災保険料",
      amount: fireInsurance,
      description: "住宅ローン契約に必要な火災保険の保険料（目安）",
    },
    {
      name: "ローン事務手数料",
      amount: loanAdminFee,
      description:
        bankType === "online"
          ? "ネット銀行：借入金額×2.2%（税込）"
          : "メガバンク・地方銀行：固定44,000円（税込）",
    },
    {
      name: "保証料",
      amount: guaranteeFee,
      description: "保証会社への保証料（借入金額×2%、ネット銀行は0円の場合もあり）",
    },
  ];

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const totalWithDownPayment = downPayment + total;

  return { items, total, totalWithDownPayment };
}
