import { useState } from "react";
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { PrepaymentInput, PrepaymentType } from "#/lib/types";

const MAX_PREPAYMENTS = 5;

interface PrepaymentSectionProps {
  prepayments: PrepaymentInput[];
  onChange: (field: string, value: unknown) => void;
}

const PREPAYMENT_TYPE_LABELS: Record<PrepaymentType, string> = {
  shorten_term: "期間短縮",
  reduce_payment: "返済額軽減",
};

export function PrepaymentSection({ prepayments, onChange }: PrepaymentSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (prepayments.length >= MAX_PREPAYMENTS) return;
    const newItem: PrepaymentInput = { year: 5, amount: 100, type: "shorten_term" };
    onChange("prepayments", [...prepayments, newItem]);
  };

  const handleRemove = (index: number) => {
    const updated = prepayments.filter((_, i) => i !== index);
    onChange("prepayments", updated);
  };

  const handleItemChange = (
    index: number,
    field: keyof PrepaymentInput,
    value: string | number,
  ) => {
    const updated = prepayments.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    onChange("prepayments", updated);
  };

  return (
    <div className="rounded-lg bg-white border border-gray-100 shadow-sm">
      {/* アコーディオンヘッダー */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-5 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            繰り上げ返済
          </h2>
          {!isOpen && prepayments.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{prepayments.length} 件設定済み</p>
          )}
        </div>
        <ChevronDownIcon
          className={`size-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* アコーディオンコンテンツ */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          {prepayments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              繰り上げ返済の予定はありません
            </p>
          )}

          {prepayments.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 bg-gray-50/40 p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  繰り上げ返済 {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="削除"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>

              {/* 何年目 */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">返済開始年目</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={item.year}
                    onChange={(e) => handleItemChange(index, "year", Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    年目
                  </span>
                </div>
              </div>

              {/* 繰り上げ額 */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">繰り上げ額</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, "amount", Number(e.target.value))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    万円
                  </span>
                </div>
              </div>

              {/* 方式 */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">方式</Label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  {(["shorten_term", "reduce_payment"] as PrepaymentType[]).map((type, i) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleItemChange(index, "type", type)}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                        i > 0 ? "border-l border-gray-200" : ""
                      } ${
                        item.type === type
                          ? "bg-slate-900 text-white"
                          : "bg-white text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {PREPAYMENT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {prepayments.length < MAX_PREPAYMENTS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
            >
              <PlusIcon className="size-4" />
              繰り上げ返済を追加
            </Button>
          )}

          {prepayments.length >= MAX_PREPAYMENTS && (
            <p className="text-xs text-muted-foreground text-center">
              最大 {MAX_PREPAYMENTS} 件まで設定できます
            </p>
          )}
        </div>
      )}
    </div>
  );
}
