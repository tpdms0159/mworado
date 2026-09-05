"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { safeAction } from "@/lib/safe-action";
import { deleteAccount, exportUserData, updateDayStartHour } from "@/server/actions/settings";
import { signOut } from "@/server/actions/auth";

const THEME_OPTIONS = [
  { value: "system", label: "기기 설정" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

export function SettingsForm({
  email,
  dayStartHour,
}: {
  email: string;
  dayStartHour: number;
}) {
  const { theme, setTheme } = useTheme();
  const [hour, setHour] = useState(dayStartHour);
  const [, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleHourChange(newHour: number) {
    setHour(newHour);
    startTransition(async () => {
      const result = await safeAction(() => updateDayStartHour(newHour));
      if (result.error) toast.error(result.error);
    });
  }

  async function handleExport() {
    setExporting(true);
    const result = await safeAction(() => exportUserData());
    setExporting(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? "내보내기에 실패했어요.");
      return;
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mworado-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete() {
    setDeleting(true);
    startTransition(async () => {
      // safeAction으로 감싸지 않는다: deleteAccount는 성공 시 내부에서
      // redirect()를 던지는데, 이는 Next.js가 내부적으로 처리해야 하는
      // 특수한 예외라 여기서 잡아버리면 리다이렉트 자체가 깨진다.
      const result = await deleteAccount();
      if (result?.error) {
        setDeleting(false);
        toast.error(result.error);
      }
      // 성공 시 서버 액션 내부에서 "/"로 redirect 된다.
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">계정</h2>
        <Card>
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <span className="text-muted-foreground min-w-0 truncate text-sm">{email}</span>
            <form action={signOut} className="shrink-0">
              <Button type="submit" variant="outline" size="sm">
                로그아웃
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">하루 시작 시각</h2>
        <p className="text-muted-foreground text-sm">
          이 시각 이전에 체크한 건 전날 몫으로 기록돼요. (기본 새벽 4시)
        </p>
        <select
          value={hour}
          onChange={(e) => handleHourChange(Number(e.target.value))}
          className="border-input bg-transparent h-9 w-32 rounded-lg border px-2.5 text-base"
          aria-label="하루 시작 시각"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">타임존</h2>
        <p className="text-muted-foreground text-sm">Asia/Seoul (현재 버전에서는 고정)</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">테마</h2>
        <div className="flex gap-1.5">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                theme === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">데이터</h2>
        <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="self-start">
          {exporting ? "내보내는 중..." : "JSON으로 내보내기"}
        </Button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-destructive text-sm font-medium">위험 구역</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10 self-start"
          onClick={() => setDeleteDialogOpen(true)}
        >
          계정 삭제
        </Button>
      </section>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 계정을 삭제할까요?</DialogTitle>
            <DialogDescription>
              할 일, 루틴, 기록이 전부 영구 삭제되고 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="outline" className="border-destructive text-destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "삭제 중..." : "삭제할게요"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
