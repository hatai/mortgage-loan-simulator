import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import type { SavedPlan } from "#/lib/types";

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface PlanCardProps {
  plan: SavedPlan;
  onDelete: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export function PlanCard({ plan, onDelete, onRename, onSelect, selected }: PlanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(plan.name);

  const handleRenameConfirm = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== plan.name && onRename) {
      onRename(plan.id, trimmed);
    } else {
      setEditName(plan.name);
    }
    setIsEditing(false);
  };

  const handleRenameCancel = () => {
    setEditName(plan.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRenameConfirm();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 transition ${selected ? "border-primary bg-primary/5" : "bg-card"}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm font-semibold"
                autoFocus
              />
              <Button variant="ghost" size="icon-xs" onClick={handleRenameConfirm}>
                <Check className="size-3.5 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={handleRenameCancel}>
                <X className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <h3
              className="font-semibold cursor-pointer hover:text-primary transition-colors truncate"
              title="クリックして名前を変更"
              onClick={() => {
                setEditName(plan.name);
                setIsEditing(true);
              }}
            >
              {plan.name}
            </h3>
          )}
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
