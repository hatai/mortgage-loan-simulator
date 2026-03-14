import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { GlossaryTooltip } from "#/components/shared/Tooltip";

interface MaintenanceSectionProps {
  maintenanceFee: number;
  repairReserve: number;
  propertyTax: number;
  onChange: (field: string, value: unknown) => void;
}

export function MaintenanceSection({
  maintenanceFee,
  repairReserve,
  propertyTax,
  onChange,
}: MaintenanceSectionProps) {
  const monthlyTotal = maintenanceFee + repairReserve + Math.round((propertyTax * 10000) / 12);

  return (
    <div className="rounded-xl bg-white shadow-sm border-l-4 border-l-amber-500 p-5">
      <h2 className="text-sm font-semibold text-amber-600 mb-4 uppercase tracking-wide">維持費</h2>

      <div className="space-y-4">
        {/* 管理費 */}
        <div className="space-y-1.5">
          <Label htmlFor="maintenanceFee" className="text-xs text-muted-foreground">
            <GlossaryTooltip termKey="maintenance_fee">管理費</GlossaryTooltip>（月額）
          </Label>
          <div className="relative">
            <Input
              id="maintenanceFee"
              type="number"
              min={0}
              step={1000}
              value={maintenanceFee}
              onChange={(e) => onChange("maintenanceFee", Number(e.target.value))}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              円
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {maintenanceFee.toLocaleString("ja-JP")} 円/月
          </p>
        </div>

        {/* 修繕積立金 */}
        <div className="space-y-1.5">
          <Label htmlFor="repairReserve" className="text-xs text-muted-foreground">
            <GlossaryTooltip termKey="repair_reserve">修繕積立金</GlossaryTooltip>（月額）
          </Label>
          <div className="relative">
            <Input
              id="repairReserve"
              type="number"
              min={0}
              step={1000}
              value={repairReserve}
              onChange={(e) => onChange("repairReserve", Number(e.target.value))}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              円
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {repairReserve.toLocaleString("ja-JP")} 円/月
          </p>
        </div>

        {/* 固定資産税 */}
        <div className="space-y-1.5">
          <Label htmlFor="propertyTax" className="text-xs text-muted-foreground">
            固定資産税（年額）
          </Label>
          <div className="relative">
            <Input
              id="propertyTax"
              type="number"
              min={0}
              step={1}
              value={propertyTax}
              onChange={(e) => onChange("propertyTax", Number(e.target.value))}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              万円
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            月割約 {Math.round((propertyTax * 10000) / 12).toLocaleString("ja-JP")} 円
          </p>
        </div>

        {/* 合計 */}
        <div className="rounded-md bg-amber-50 px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-amber-700 font-medium">維持費合計（月額）</span>
          <span className="text-base font-bold text-amber-700">
            {monthlyTotal.toLocaleString("ja-JP")} 円
          </span>
        </div>
      </div>
    </div>
  );
}
