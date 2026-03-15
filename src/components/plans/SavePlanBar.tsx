import { useState } from "react";
import { Save, GitCompare, Share2, Printer } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import type { LoanInput, LoanResult } from "#/lib/types";
import { encodeParams } from "#/lib/url-params";

interface SavePlanBarProps {
  input: LoanInput;
  result: LoanResult | null;
  onSave: (name: string) => void;
  onAddToCompare?: () => void;
}

export function SavePlanBar({ input, result, onSave, onAddToCompare }: SavePlanBarProps) {
  const [planName, setPlanName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleSave = () => {
    if (showNameInput && planName.trim()) {
      onSave(planName.trim());
      setPlanName("");
      setShowNameInput(false);
    } else {
      setShowNameInput(true);
    }
  };

  const handleShare = async () => {
    const params = encodeParams(input);
    const url = `${window.location.origin}/${params ? `?${params}` : ""}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      {showNameInput && (
        <Input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="プラン名を入力"
          className="h-8 w-40"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
      )}
      <Button variant="default" size="sm" onClick={handleSave}>
        <Save className="size-4" />
        {showNameInput ? "保存" : "プランを保存"}
      </Button>
      {onAddToCompare && (
        <Button variant="outline" size="sm" onClick={onAddToCompare}>
          <GitCompare className="size-4" />
          比較に追加
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="size-4" />
        {copied ? "コピー済み!" : "共有リンク"}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
        <Printer className="size-4" />
        印刷
      </Button>
    </div>
  );
}
