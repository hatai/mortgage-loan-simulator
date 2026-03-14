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
    <div className="rounded-xl bg-white shadow-sm border-l-4 border-l-blue-500 p-5">
      <h2 className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wide">物件情報</h2>

      <div className="space-y-4">
        {/* 物件種別 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">物件種別</Label>
          <div className="flex rounded-md overflow-hidden border border-input">
            <button
              type="button"
              onClick={() => onChange("propertyType", "new")}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                propertyType === "new"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-foreground hover:bg-blue-50"
              }`}
            >
              新築
            </button>
            <button
              type="button"
              onClick={() => onChange("propertyType", "used")}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors border-l border-input ${
                propertyType === "used"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-foreground hover:bg-blue-50"
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
        <div className="rounded-md bg-blue-50 px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-blue-700 font-medium">借入金額</span>
          <span className="text-base font-bold text-blue-700">
            {loanAmount.toLocaleString("ja-JP")} 万円
          </span>
        </div>
      </div>
    </div>
  );
}
