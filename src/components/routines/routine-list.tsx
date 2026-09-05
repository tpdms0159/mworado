"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppNav } from "@/components/layout/app-nav";
import { safeAction } from "@/lib/safe-action";
import { createRoutine, setRoutineArchived, updateRoutine } from "@/server/actions/routines";
import type { Routine } from "@/server/queries/routines";
import type { RepeatConfig, RepeatType } from "@/lib/date/recurrence";
import { RoutineCard } from "./routine-card";
import { RoutineForm } from "./routine-form";

type Action =
  | { type: "add"; routine: Routine }
  | { type: "update"; id: string; name: string; repeatType: RepeatType; repeatConfig: RepeatConfig }
  | { type: "archive"; id: string; archived: boolean };

function applyAction(state: Routine[], action: Action): Routine[] {
  switch (action.type) {
    case "add":
      return [...state, action.routine];
    case "update":
      return state.map((r) =>
        r.id === action.id
          ? { ...r, name: action.name, repeatType: action.repeatType, repeatConfig: action.repeatConfig }
          : r,
      );
    case "archive":
      return state.map((r) => (r.id === action.id ? { ...r, isArchived: action.archived } : r));
  }
}

export function RoutineList({ initialRoutines }: { initialRoutines: Routine[] }) {
  const [optimisticRoutines, applyOptimistic] = useOptimistic(initialRoutines, applyAction);
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  function openCreateDialog() {
    setEditingRoutine(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(routine: Routine) {
    setEditingRoutine(routine);
    setDialogOpen(true);
  }

  function handleFormSubmit(name: string, repeatType: RepeatType, repeatConfig: RepeatConfig) {
    setSubmitting(true);

    if (editingRoutine) {
      const id = editingRoutine.id;
      startTransition(async () => {
        applyOptimistic({ type: "update", id, name, repeatType, repeatConfig });
        const result = await safeAction(() => updateRoutine(id, name, repeatType, repeatConfig));
        setSubmitting(false);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setDialogOpen(false);
      });
    } else {
      startTransition(async () => {
        applyOptimistic({
          type: "add",
          routine: {
            id: `temp-${crypto.randomUUID()}`,
            name,
            repeatType,
            repeatConfig,
            sortOrder: optimisticRoutines.length,
            isArchived: false,
          },
        });
        const result = await safeAction(() => createRoutine(name, repeatType, repeatConfig));
        setSubmitting(false);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setDialogOpen(false);
      });
    }
  }

  function handleToggleArchive(routine: Routine) {
    const nextArchived = !routine.isArchived;
    startTransition(async () => {
      applyOptimistic({ type: "archive", id: routine.id, archived: nextArchived });
      const result = await safeAction(() => setRoutineArchived(routine.id, nextArchived));
      if (result.error) toast.error(result.error);
    });
  }

  const active = optimisticRoutines.filter((r) => !r.isArchived);
  const archived = optimisticRoutines.filter((r) => r.isArchived);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <header className="p-4 pb-0">
        <AppNav />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">루틴</h1>
          <Button type="button" size="sm" onClick={openCreateDialog}>
            새 루틴
          </Button>
        </div>

      {active.length === 0 && archived.length === 0 && (
        <p className="text-muted-foreground py-16 text-center text-sm">
          아직 루틴이 없어요. 매일 반복할 일을 하나 만들어볼까?
        </p>
      )}

      {active.length > 0 && (
        <ul className="flex flex-col gap-1.5" role="list">
          {active.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onEdit={openEditDialog}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="text-muted-foreground self-start text-sm"
          >
            보관됨 {archived.length}개 {showArchived ? "접기" : "펼치기"}
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-1.5" role="list">
              {archived.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onEdit={openEditDialog}
                  onToggleArchive={handleToggleArchive}
                />
              ))}
            </ul>
          )}
        </div>
      )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoutine ? "루틴 수정" : "루틴 추가"}</DialogTitle>
          </DialogHeader>
          <RoutineForm
            routine={editingRoutine}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
