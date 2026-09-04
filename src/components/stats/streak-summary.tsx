import { Card, CardContent } from "@/components/ui/card";

export function StreakSummary({
  currentStreak,
  longestStreak,
  last30DaysRate,
}: {
  currentStreak: number;
  longestStreak: number;
  last30DaysRate: number;
}) {
  const items = [
    { label: "현재 연속일", value: `${currentStreak}일` },
    { label: "최장 연속일", value: `${longestStreak}일` },
    { label: "최근 30일 완료율", value: `${Math.round(last30DaysRate * 100)}%` },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <Card key={item.label} className="gap-1 p-3">
          <CardContent className="flex flex-col gap-1 p-0">
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <span className="text-lg font-semibold tabular-nums">{item.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
