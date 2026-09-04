"use client";

import { useRef, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";

export function QuickAddInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="오늘 뭐라도 하나 적어볼까?"
        aria-label="할 일 추가"
        className="h-10 flex-1 text-base"
      />
    </form>
  );
}
