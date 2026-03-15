import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { PropertyType } from "#/lib/types";

interface PropertySectionProps {
  propertyPrice: number;
  downPayment: number;
  propertyType: PropertyType;
  onChange: (field: string, value: unknown) => void;
}

export function PropertySection({
  propertyPrice,
  downPayment,
  propertyType,
  onChange,
}: PropertySectionProps) {
  const loanAmount = propertyPrice - downPayment;
  const downPaymentRatio =
    propertyPrice > 0 ? ((downPayment / propertyPrice) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-lg bg-card border border-border shadow-sm p-5">
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">物件情報</h2>

      <div className="space-y-3">
        {/* 物件種別 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">物件種別</Label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => onChange("propertyType", "new")}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                propertyType === "new"
                  ? "bg-slate-900 text-white"
                  : "bg-card text-muted-foreground hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              新築
            </button>
            <button
              type="button"
              onClick={() => onChange("propertyType", "used")}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                propertyType === "used"
                  ? "bg-slate-900 text-white"
                  : "bg-card text-muted-foreground hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              中古
            </button>
          </div>
        </div>

        {/* 物件価格 */}
        <div className="space-y-1.5">
          <Label htmlFor="propertyPrice" className="text-xs text-muted-foreground">
            物件価格
          </Label>
          <div className="relative">
            <Input
              id="propertyPrice"
              type="number"
              min={0}
              step={100}
              value={propertyPrice}
              onChange={(e) => onChange("propertyPrice", Number(e.target.value))}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              万円
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {(propertyPrice * 10000).toLocaleString("ja-JP")} 円
          </p>
        </div>

        {/* 頭金 */}
        <div className="space-y-1.5">
          <Label htmlFor="downPayment" className="text-xs text-muted-foreground">
            頭金
          </Label>
          <div className="relative">
            <Input
              id="downPayment"
              type="number"
              min={0}
              step={10}
              value={downPayment}
              onChange={(e) => onChange("downPayment", Number(e.target.value))}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              万円
            </span>
          </div>
          <p className="text-xs text-muted-foreground">物件価格の {downPaymentRatio}%</p>
        </div>

        {/* 借入金額（計算表示） */}
        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">借入金額</span>
          <span className="text-base font-bold text-blue-700 dark:text-blue-300">
            {loanAmount.toLocaleString("ja-JP")} 万円
          </span>
        </div>
      </div>
    </div>
  );
}
