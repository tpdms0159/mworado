import { Progress } from "@/components/ui/progress";

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <Progress value={percent} className="flex-1" aria-label="오늘 진행률" />
      <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}
