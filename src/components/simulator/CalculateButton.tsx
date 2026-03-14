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
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md transition-all"
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
