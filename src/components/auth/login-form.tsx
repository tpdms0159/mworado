"use client";

import { useActionState } from "react";
import { signInWithMagicLink, type MagicLinkState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: MagicLinkState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div className="space-y-2 text-center" role="status">
        <p className="text-lg font-medium">메일함을 확인해 주세요</p>
        <p className="text-muted-foreground text-sm">
          {state.email} 주소로 로그인 링크를 보냈어요. 링크를 누르면 바로 로그인돼요.
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
        {pending ? "보내는 중..." : "로그인 링크 받기"}
      </Button>
    </form>
  );
}
