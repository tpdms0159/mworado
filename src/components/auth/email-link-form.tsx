"use client";

import { useActionState } from "react";
import type { EmailLinkState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: EmailLinkState = { status: "idle" };

type Action = (
  prevState: EmailLinkState,
  formData: FormData,
) => Promise<EmailLinkState>;

// 가입 링크 / 비밀번호 재설정 링크처럼 "이메일만 받아 메일을 보내는" 폼 공통 UI.
// sentDescription의 "{email}" 자리에 입력한 주소가 들어간다.
export function EmailLinkForm({
  action,
  submitLabel,
  pendingLabel,
  sentTitle,
  sentDescription,
}: {
  action: Action;
  submitLabel: string;
  pendingLabel: string;
  sentTitle: string;
  sentDescription: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.status === "sent") {
    return (
      <div className="space-y-2 text-center" role="status">
        <p className="text-lg font-medium">{sentTitle}</p>
        <p className="text-muted-foreground text-sm">
          {sentDescription.replace("{email}", state.email)}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      {state.status === "error" && (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
