import type { Metadata } from "next";
import Link from "next/link";
import { DemoExperience } from "@/components/demo/demo-experience";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "체험해보기",
};

export default function DemoPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-accent text-accent-foreground flex flex-col items-center gap-2 px-4 py-3 text-center text-sm sm:flex-row sm:justify-center">
        <span>지금 둘러보고 있는 데모예요. 새로고침하면 초기화돼요.</span>
        <Button render={<Link href="/login" />} size="sm" variant="outline" className="bg-background">
          시작하기
        </Button>
      </div>
      <DemoExperience />
    </div>
  );
}
