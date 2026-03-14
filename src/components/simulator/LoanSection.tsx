import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { GlossaryTooltip } from "#/components/shared/Tooltip";
import type { BankType, EnergyPerformance, InterestType, RepaymentMethod } from "#/lib/types";

interface LoanSectionProps {
  interestType: InterestType;
  interestRate: number;
  loanTermYears: number;
  repaymentMethod: RepaymentMethod;
  bonusPayment: number;
  bankType: BankType;
  energyPerformance: EnergyPerformance;
  isChildRearingHousehold: boolean;
  onChange: (field: string, value: unknown) => void;
}

const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  fixed: "固定",
  variable: "変動",
  flat35: "フラット35",
};

const INTEREST_TYPE_DEFAULTS: Record<InterestType, number> = {
  fixed: 1.5,
  variable: 0.5,
  flat35: 1.8,
};

const REPAYMENT_METHOD_LABELS: Record<RepaymentMethod, string> = {
  equal_payment: "元利均等",
  equal_principal: "元金均等",
};

const BANK_TYPE_LABELS: Record<BankType, string> = {
  online: "ネット銀行",
  major: "都市銀行",
};

const ENERGY_PERFORMANCE_OPTIONS: { value: EnergyPerformance; label: string }[] = [
  { value: "zeh", label: "ZEH水準" },
  { value: "certified", label: "認定長期優良" },
  { value: "energy_standard", label: "省エネ基準" },
  { value: "other", label: "その他" },
];

export function LoanSection({
  interestType,
  interestRate,
  loanTermYears,
  repaymentMethod,
  bonusPayment,
  bankType,
  energyPerformance,
  isChildRearingHousehold,
  onChange,
}: LoanSectionProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border-l-4 border-l-purple-500 p-5">
      <h2 className="text-sm font-semibold text-purple-600 mb-4 uppercase tracking-wide">
        ローン条件
      </h2>

      <div className="space-y-4">
        {/* 金利タイプ */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            <GlossaryTooltip termKey="fixed_rate">金利タイプ</GlossaryTooltip>
          </Label>
          <div className="flex rounded-md overflow-hidden border border-input">
            {(["fixed", "variable", "flat35"] as InterestType[]).map((type, i) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onChange("interestType", type);
                  onChange("interestRate", INTEREST_TYPE_DEFAULTS[type]);
                }}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                  i > 0 ? "border-l border-input" : ""
                } ${
                  interestType === type
                    ? "bg-purple-500 text-white"
                    : "bg-white text-foreground hover:bg-purple-50"
                }`}
              >
                {INTEREST_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 銀行タイプ */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">銀行タイプ</Label>
          <div className="flex rounded-md overflow-hidden border border-input">
            {(["online", "major"] as BankType[]).map((type, i) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange("bankType", type)}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                  i > 0 ? "border-l border-input" : ""
                } ${
                  bankType === type
                    ? "bg-purple-500 text-white"
                    : "bg-white text-foreground hover:bg-purple-50"
                }`}
              >
                {BANK_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 金利 */}
        <div className="space-y-1.5">
          <Label htmlFor="interestRate" className="text-xs text-muted-foreground">
            金利
          </Label>
          <div className="relative">
            <Input
              id="interestRate"
              type="number"
              min={0}
              max={20}
              step={0.01}
              value={interestRate}
              onChange={(e) => onChange("interestRate", Number(e.target.value))}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              %
            </span>
          </div>
        </div>

        {/* 返済期間 */}
        <div className="space-y-1.5">
          <Label htmlFor="loanTermYears" className="text-xs text-muted-foreground">
            返済期間
          </Label>
          <div className="relative">
            <Input
              id="loanTermYears"
              type="number"
              min={1}
              max={50}
              step={1}
              value={loanTermYears}
              onChange={(e) => onChange("loanTermYears", Number(e.target.value))}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              年
            </span>
          </div>
        </div>

        {/* 返済方式 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            <GlossaryTooltip termKey="equal_payment">返済方式</GlossaryTooltip>
          </Label>
          <div className="flex rounded-md overflow-hidden border border-input">
            {(["equal_payment", "equal_principal"] as RepaymentMethod[]).map((method, i) => (
              <button
                key={method}
                type="button"
                onClick={() => onChange("repaymentMethod", method)}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                  i > 0 ? "border-l border-input" : ""
                } ${
                  repaymentMethod === method
                    ? "bg-purple-500 text-white"
                    : "bg-white text-foreground hover:bg-purple-50"
                }`}
              >
                {REPAYMENT_METHOD_LABELS[method]}
              </button>
            ))}
          </div>
        </div>

        {/* ボーナス返済 */}
        <div className="space-y-1.5">
          <Label htmlFor="bonusPayment" className="text-xs text-muted-foreground">
            ボーナス返済額（年2回）
          </Label>
          <div className="relative">
            <Input
              id="bonusPayment"
              type="number"
              min={0}
              step={1}
              value={bonusPayment}
              onChange={(e) => onChange("bonusPayment", Number(e.target.value))}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              万円
            </span>
          </div>
        </div>

        {/* 省エネ性能 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">省エネ性能</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {ENERGY_PERFORMANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange("energyPerformance", opt.value)}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors ${
                  energyPerformance === opt.value
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-white text-foreground border-input hover:bg-purple-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 子育て世帯 */}
        <div className="flex items-center justify-between">
          <Label htmlFor="childRearing" className="text-xs text-muted-foreground cursor-pointer">
            子育て世帯フラグ
            <span className="block text-[10px] text-muted-foreground/70 mt-0.5">
              住宅ローン控除の優遇対象
            </span>
          </Label>
          <button
            id="childRearing"
            type="button"
            role="switch"
            aria-checked={isChildRearingHousehold}
            onClick={() => onChange("isChildRearingHousehold", !isChildRearingHousehold)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              isChildRearingHousehold ? "bg-purple-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                isChildRearingHousehold ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
