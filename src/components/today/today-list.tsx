"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleRoutineLog } from "@/server/actions/routines";
import {
  createTodo,
  deleteTodo,
  reorderTodos,
  restoreTodo,
  toggleTodo,
  updateTodoTitle,
} from "@/server/actions/todos";
import type { RoutineTodayItem, Todo } from "@/server/queries/today";
import { safeAction } from "@/lib/safe-action";
import { ProgressBar } from "./progress-bar";
import { QuickAddInput } from "./quick-add-input";
import { RoutineRow } from "./routine-row";
import { SortableTodoList } from "./sortable-todo-list";
import { TodoRow } from "./todo-row";

type TodoAction =
  | { type: "add"; todo: Todo }
  | { type: "toggle"; id: string; completed: boolean }
  | { type: "edit"; id: string; title: string }
  | { type: "remove"; id: string }
  | { type: "restore"; todo: Todo }
  | { type: "reorder"; ids: string[] };

function applyTodoAction(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "add":
      return [...state, action.todo];
    case "toggle":
      return state.map((t) => (t.id === action.id ? { ...t, completed: action.completed } : t));
    case "edit":
      return state.map((t) => (t.id === action.id ? { ...t, title: action.title } : t));
    case "remove":
      return state.filter((t) => t.id !== action.id);
    case "restore":
      return state.some((t) => t.id === action.todo.id) ? state : [...state, action.todo];
    case "reorder": {
      const byId = new Map(state.map((t) => [t.id, t]));
      return action.ids
        .map((id, index) => {
          const todo = byId.get(id);
          return todo ? { ...todo, sortOrder: index } : null;
        })
        .filter((t): t is Todo => t !== null);
    }
  }
}

function applyRoutineToggle(
  state: RoutineTodayItem[],
  action: { id: string; completed: boolean },
): RoutineTodayItem[] {
  return state.map((r) => (r.id === action.id ? { ...r, completed: action.completed } : r));
}

export function TodayList({
  initialTodos,
  initialRoutines,
}: {
  initialTodos: Todo[];
  initialRoutines: RoutineTodayItem[];
}) {
  const [optimisticTodos, applyTodo] = useOptimistic(initialTodos, applyTodoAction);
  const [optimisticRoutines, applyRoutine] = useOptimistic(initialRoutines, applyRoutineToggle);
  const [, startTransition] = useTransition();
  const [showCompleted, setShowCompleted] = useState(true);

  function handleAddTodo(title: string) {
    startTransition(async () => {
      applyTodo({
        type: "add",
        todo: {
          id: `temp-${crypto.randomUUID()}`,
          title,
          completed: false,
          sortOrder: optimisticTodos.length,
        },
      });
      const result = await safeAction(() => createTodo(title));
      if (result.error) toast.error(result.error);
    });
  }

  function handleToggleTodo(id: string, completed: boolean) {
    startTransition(async () => {
      applyTodo({ type: "toggle", id, completed });
      const result = await safeAction(() => toggleTodo(id, completed));
      if (result.error) toast.error(result.error);
    });
  }

  function handleEditTodo(id: string, title: string) {
    startTransition(async () => {
      applyTodo({ type: "edit", id, title });
      const result = await safeAction(() => updateTodoTitle(id, title));
      if (result.error) toast.error(result.error);
    });
  }

  function handleDeleteTodo(id: string) {
    const removed = optimisticTodos.find((t) => t.id === id);

    startTransition(async () => {
      applyTodo({ type: "remove", id });
      const result = await safeAction(() => deleteTodo(id));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast("할 일을 지웠어요", {
        duration: 5000,
        action: {
          label: "실행 취소",
          onClick: () => {
            if (!removed) return;
            startTransition(async () => {
              applyTodo({ type: "restore", todo: removed });
              const restoreResult = await safeAction(() => restoreTodo(id));
              if (restoreResult.error) toast.error(restoreResult.error);
            });
          },
        },
      });
    });
  }

  function handleReorderTodo(ids: string[]) {
    startTransition(async () => {
      applyTodo({ type: "reorder", ids });
      const result = await safeAction(() => reorderTodos(ids));
      if (result.error) toast.error(result.error);
    });
  }

  function handleToggleRoutine(id: string, completed: boolean) {
    startTransition(async () => {
      applyRoutine({ id, completed });
      const result = await safeAction(() => toggleRoutineLog(id, completed));
      if (result.error) toast.error(result.error);
    });
  }

  const totalCount = optimisticTodos.length + optimisticRoutines.length;
  const doneCount =
    optimisticTodos.filter((t) => t.completed).length +
    optimisticRoutines.filter((r) => r.completed).length;

  const incompleteTodos = [...optimisticTodos]
    .filter((t) => !t.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const completedTodos = [...optimisticTodos]
    .filter((t) => t.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const incompleteRoutines = optimisticRoutines.filter((r) => !r.completed);
  const completedRoutines = optimisticRoutines.filter((r) => r.completed);
  const completedCount = completedTodos.length + completedRoutines.length;
  const hasIncomplete = incompleteTodos.length > 0 || incompleteRoutines.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      {totalCount > 0 && <ProgressBar done={doneCount} total={totalCount} />}
      <QuickAddInput onAdd={handleAddTodo} />

      {totalCount === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center">
          <p className="text-muted-foreground text-base">
            오늘은 아직 아무것도 없네. 뭐라도 하나 적어볼까?
          </p>
        </div>
      )}

      {totalCount > 0 && !hasIncomplete && (
        <p className="text-muted-foreground py-4 text-center text-sm">오늘 할 일 끝. 잘했어.</p>
      )}

      {incompleteRoutines.length > 0 && (
        <ul className="flex flex-col gap-1.5" role="list">
          {incompleteRoutines.map((routine) => (
            <RoutineRow key={routine.id} routine={routine} onToggle={handleToggleRoutine} />
          ))}
        </ul>
      )}

      {incompleteTodos.length > 0 && (
        <SortableTodoList
          items={incompleteTodos}
          onToggle={handleToggleTodo}
          onEdit={handleEditTodo}
          onDelete={handleDeleteTodo}
          onReorder={handleReorderTodo}
        />
      )}

      {completedCount > 0 && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="text-muted-foreground self-start text-sm"
          >
            완료 {completedCount}개 {showCompleted ? "접기" : "펼치기"}
          </button>
          {showCompleted && (
            <ul className="flex flex-col gap-1.5" role="list">
              {completedRoutines.map((routine) => (
                <RoutineRow key={routine.id} routine={routine} onToggle={handleToggleRoutine} />
              ))}
              {completedTodos.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onEdit={handleEditTodo}
                  onDelete={handleDeleteTodo}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
