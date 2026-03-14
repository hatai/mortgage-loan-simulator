import { Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { SavedPlan } from "#/lib/types";

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface PlanCardProps {
  plan: SavedPlan;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export function PlanCard({ plan, onDelete, onSelect, selected }: PlanCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${selected ? "border-primary bg-primary/5" : "bg-card"}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(plan.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={() => onDelete(plan.id)}>
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">物件価格</span>
          <p className="font-medium">{plan.input.propertyPrice.toLocaleString("ja-JP")}万円</p>
        </div>
        <div>
          <span className="text-muted-foreground">月々支払額</span>
          <p className="font-medium">{formatManYen(plan.result.totalMonthlyPayment)}</p>
        </div>
      </div>
      {onSelect && (
        <Button
          variant={selected ? "default" : "outline"}
          size="sm"
          className="mt-3 w-full"
          onClick={() => onSelect(plan.id)}
        >
          {selected ? "選択中" : "比較に追加"}
        </Button>
      )}
    </div>
  );
}
