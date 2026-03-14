import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

interface RentComparisonInputProps {
  currentRent?: number;
  rentIncreaseRate?: number;
  onChange: (field: string, value: unknown) => void;
}

export function RentComparisonInput({
  currentRent,
  rentIncreaseRate,
  onChange,
}: RentComparisonInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isEnabled = currentRent !== undefined && currentRent > 0;

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
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">賃貸比較</h2>
          {!isOpen && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEnabled ? `家賃 ${(currentRent ?? 0).toLocaleString("ja-JP")} 円/月` : "設定なし"}
            </p>
          )}
        </div>
        <ChevronDownIcon
          className={`size-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* アコーディオンコンテンツ */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            現在の家賃を入力すると、購入との総コスト比較を表示します。
          </p>

          {/* 現在の家賃 */}
          <div className="space-y-1.5">
            <Label htmlFor="currentRent" className="text-xs text-muted-foreground">
              現在の家賃（月額）
            </Label>
            <div className="relative">
              <Input
                id="currentRent"
                type="number"
                min={0}
                step={1000}
                value={currentRent ?? ""}
                placeholder="例: 100000"
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : Number(e.target.value);
                  onChange("currentRent", val);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                円
              </span>
            </div>
            {currentRent !== undefined && currentRent > 0 && (
              <p className="text-xs text-muted-foreground">
                年間 {(currentRent * 12).toLocaleString("ja-JP")} 円
              </p>
            )}
          </div>

          {/* 家賃上昇率 */}
          <div className="space-y-1.5">
            <Label htmlFor="rentIncreaseRate" className="text-xs text-muted-foreground">
              家賃上昇率（年率）
            </Label>
            <div className="relative">
              <Input
                id="rentIncreaseRate"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={rentIncreaseRate ?? ""}
                placeholder="例: 1.0"
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : Number(e.target.value);
                  onChange("rentIncreaseRate", val);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">0% で固定家賃として計算します</p>
          </div>

          {/* 家賃設定サマリー */}
          {isEnabled && (
            <div className="rounded-md bg-gray-50 px-4 py-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700 font-medium">月額家賃</span>
                <span className="text-sm font-bold text-gray-700">
                  {(currentRent ?? 0).toLocaleString("ja-JP")} 円
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700">年間上昇率</span>
                <span className="text-sm text-gray-700">{rentIncreaseRate ?? 0} %</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
