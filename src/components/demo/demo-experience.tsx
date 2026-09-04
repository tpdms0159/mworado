"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/today/progress-bar";
import { QuickAddInput } from "@/components/today/quick-add-input";
import { RoutineRow } from "@/components/today/routine-row";
import { SortableTodoList } from "@/components/today/sortable-todo-list";
import { TodoRow } from "@/components/today/todo-row";
import type { RoutineTodayItem, Todo } from "@/server/queries/today";

const INITIAL_TODOS: Todo[] = [
  { id: "demo-todo-1", title: "설거지하기", completed: false, sortOrder: 0 },
  { id: "demo-todo-2", title: "책 10페이지 읽기", completed: true, sortOrder: 1 },
];

const INITIAL_ROUTINES: RoutineTodayItem[] = [
  { id: "demo-routine-1", title: "물 2L 마시기", completed: false, streak: 5 },
  { id: "demo-routine-2", title: "스트레칭", completed: true, streak: 12 },
];

// 데모는 로그인/서버 없이 로컬 state로만 동작한다. 실제 오늘 화면(today-list.tsx)과
// 로직이 비슷하지만 서버 액션 호출이 전혀 없어 의도적으로 별도 컴포넌트로 분리했다.
export function DemoExperience() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [routines, setRoutines] = useState<RoutineTodayItem[]>(INITIAL_ROUTINES);
  const [showCompleted, setShowCompleted] = useState(true);

  function handleAdd(title: string) {
    setTodos((prev) => [
      ...prev,
      { id: `demo-${crypto.randomUUID()}`, title, completed: false, sortOrder: prev.length },
    ]);
  }

  function handleToggleTodo(id: string, completed: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
  }

  function handleEditTodo(id: string, title: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
  }

  function handleDeleteTodo(id: string) {
    const removed = todos.find((t) => t.id === id);
    if (!removed) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    toast("할 일을 지웠어요", {
      duration: 5000,
      action: {
        label: "실행 취소",
        onClick: () => setTodos((prev) => [...prev, removed]),
      },
    });
  }

  function handleReorderTodo(ids: string[]) {
    setTodos((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]));
      return ids
        .map((id, index) => {
          const todo = byId.get(id);
          return todo ? { ...todo, sortOrder: index } : null;
        })
        .filter((t): t is Todo => t !== null);
    });
  }

  function handleToggleRoutine(id: string, completed: boolean) {
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, completed } : r)));
  }

  const totalCount = todos.length + routines.length;
  const doneCount =
    todos.filter((t) => t.completed).length + routines.filter((r) => r.completed).length;
  const incompleteTodos = [...todos]
    .filter((t) => !t.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const completedTodos = [...todos]
    .filter((t) => t.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const incompleteRoutines = routines.filter((r) => !r.completed);
  const completedRoutines = routines.filter((r) => r.completed);
  const completedCount = completedTodos.length + completedRoutines.length;
  const hasIncomplete = incompleteTodos.length > 0 || incompleteRoutines.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      {totalCount > 0 && <ProgressBar done={doneCount} total={totalCount} />}
      <QuickAddInput onAdd={handleAdd} />

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
