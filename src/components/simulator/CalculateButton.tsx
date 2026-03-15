import { CalculatorIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "#/components/ui/button";

interface CalculateButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function CalculateButton({ onClick, isLoading }: CalculateButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      size="lg"
      className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-lg h-12 text-base font-medium transition-colors"
    >
      {isLoading ? (
        <>
          <LoaderCircleIcon className="size-5 animate-spin" />
          計算中...
        </>
      ) : (
        <>
          <CalculatorIcon className="size-5" />
          シミュレーション実行
        </>
      )}
    </Button>
  );
}
