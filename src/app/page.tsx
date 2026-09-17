import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground text-sm">
        섹션 업무 현황 대쉬보드 — 준비 중
      </p>
      <ThemeToggle />
    </div>
  );
}
