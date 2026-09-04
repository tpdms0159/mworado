"use client";

import { useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { GripVertical, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo } from "@/server/queries/today";

export function TodoRow({
  todo,
  onToggle,
  onEdit,
  onDelete,
  dragHandleProps,
  style,
  setNodeRef,
}: {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  style?: CSSProperties;
  setNodeRef?: (node: HTMLLIElement | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setDraft(todo.title);
    setIsEditing(true);
  }

  function commitEdit() {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== todo.title) {
      onEdit(todo.id, trimmed);
    } else {
      setDraft(todo.title);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors duration-200",
        todo.completed && "border-transparent bg-transparent",
      )}
    >
      {dragHandleProps ? (
        <button
          type="button"
          className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
          aria-label="순서 변경"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => onToggle(todo.id, checked)}
        aria-label={todo.completed ? `"${todo.title}" 완료 취소` : `"${todo.title}" 완료로 표시`}
      />
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") {
              setDraft(todo.title);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-base outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className={cn(
            "min-w-0 flex-1 truncate text-left text-base",
            todo.completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`"${todo.title}" 삭제`}
        className="text-muted-foreground hover:text-destructive shrink-0"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
