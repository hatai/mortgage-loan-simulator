import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePlans } from "#/hooks/use-plans";
import { PlanCard } from "#/components/plans/PlanCard";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/plans")({ component: PlansPage });

function PlansPage() {
  const { plans, remove, rename } = usePlans();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2) {
      navigate({ to: "/compare", search: { ids: selectedIds.join(",") } as Record<string, string> });
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">保存済みプラン</h1>
        {selectedIds.length >= 2 && (
          <Button onClick={handleCompare}>
            選択中の {selectedIds.length} プランを比較
          </Button>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            保存済みのプランはありません
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            シミュレーション結果を保存すると、ここに表示されます
          </p>
        </div>
      ) : (
        <>
          {selectedIds.length > 0 && selectedIds.length < 2 && (
            <p className="mb-4 text-sm text-muted-foreground">
              比較するには2つ以上のプランを選択してください
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={remove}
                onRename={rename}
                onSelect={handleSelect}
                selected={selectedIds.includes(plan.id)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
