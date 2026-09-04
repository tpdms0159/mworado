"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTodo,
  deleteTodo,
  reorderTodos,
  restoreTodo,
  toggleTodo,
  updateTodoTitle,
} from "@/server/actions/todos";
import type { Todo } from "@/server/queries/today";
import { ProgressBar } from "./progress-bar";
import { QuickAddInput } from "./quick-add-input";
import { SortableTodoList } from "./sortable-todo-list";
import { TodoRow } from "./todo-row";

type OptimisticAction =
  | { type: "add"; todo: Todo }
  | { type: "toggle"; id: string; completed: boolean }
  | { type: "edit"; id: string; title: string }
  | { type: "remove"; id: string }
  | { type: "restore"; todo: Todo }
  | { type: "reorder"; ids: string[] };

function applyAction(state: Todo[], action: OptimisticAction): Todo[] {
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

export function TodayList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, applyOptimistic] = useOptimistic(initialTodos, applyAction);
  const [, startTransition] = useTransition();
  const [showCompleted, setShowCompleted] = useState(true);

  function handleAdd(title: string) {
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        todo: {
          id: `temp-${crypto.randomUUID()}`,
          title,
          completed: false,
          sortOrder: optimisticTodos.length,
        },
      });
      const result = await createTodo(title);
      if (result.error) toast.error(result.error);
    });
  }

  function handleToggle(id: string, completed: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id, completed });
      const result = await toggleTodo(id, completed);
      if (result.error) toast.error(result.error);
    });
  }

  function handleEdit(id: string, title: string) {
    startTransition(async () => {
      applyOptimistic({ type: "edit", id, title });
      const result = await updateTodoTitle(id, title);
      if (result.error) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    const removed = optimisticTodos.find((t) => t.id === id);

    startTransition(async () => {
      applyOptimistic({ type: "remove", id });
      const result = await deleteTodo(id);
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
              applyOptimistic({ type: "restore", todo: removed });
              const restoreResult = await restoreTodo(id);
              if (restoreResult.error) toast.error(restoreResult.error);
            });
          },
        },
      });
    });
  }

  function handleReorder(ids: string[]) {
    startTransition(async () => {
      applyOptimistic({ type: "reorder", ids });
      const result = await reorderTodos(ids);
      if (result.error) toast.error(result.error);
    });
  }

  const total = optimisticTodos.length;
  const doneCount = optimisticTodos.filter((t) => t.completed).length;
  const incomplete = [...optimisticTodos]
    .filter((t) => !t.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const completed = [...optimisticTodos]
    .filter((t) => t.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      {total > 0 && <ProgressBar done={doneCount} total={total} />}
      <QuickAddInput onAdd={handleAdd} />

      {total === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center">
          <p className="text-muted-foreground text-base">
            오늘은 아직 아무것도 없네. 뭐라도 하나 적어볼까?
          </p>
        </div>
      )}

      {incomplete.length === 0 && completed.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-sm">오늘 할 일 끝. 잘했어.</p>
      )}

      {incomplete.length > 0 && (
        <SortableTodoList
          items={incomplete}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      )}

      {completed.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="text-muted-foreground self-start text-sm"
          >
            완료 {completed.length}개 {showCompleted ? "접기" : "펼치기"}
          </button>
          {showCompleted && (
            <ul className="flex flex-col gap-1.5" role="list">
              {completed.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
