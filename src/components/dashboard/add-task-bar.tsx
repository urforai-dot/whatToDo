"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Positional slash-parsing is ambiguous when a middle field is skipped
// (e.g. "title / model / 2026-09-30" meant to skip owner) — a trailing
// segment that looks like a date is treated as the due date regardless
// of how many segments came before it, instead of always reading index 3.
function parseTaskInput(raw: string) {
  const segments = raw.split("/").map((s) => s.trim());
  const title = segments[0] ?? "";
  const rest = segments.slice(1);
  let dueDate: string | undefined;
  if (rest.length > 0 && DATE_RE.test(rest[rest.length - 1])) {
    dueDate = rest.pop();
  }
  const model = rest[0] || undefined;
  return { title, model, dueDate };
}

export function AddTaskBar({ onAdded }: { onAdded: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsed = value.trim() ? parseTaskInput(value) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed || !parsed.title) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: parsed.title, model: parsed.model, dueDate: parsed.dueDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "업무 추가에 실패했습니다.");
      }
      setValue("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업무 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-border flex flex-col gap-1.5 border-t px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="업무 추가 — 업무명 / 모델명 / 완료예상일(YYYY-MM-DD) · 담당자는 등록 후 상세에서 배정"
          aria-label="새 업무 정보"
          autoComplete="off"
          className="min-w-45 flex-1"
        />
        <Button type="submit" disabled={submitting || !parsed?.title}>
          등록
        </Button>
      </div>
      {parsed && (
        <p className="text-muted-foreground text-[11px]">
          제목: {parsed.title || "—"} · 모델: {parsed.model ?? "—"} · 마감일: {parsed.dueDate ?? "—"}
        </p>
      )}
      {error && (
        <p role="alert" aria-live="polite" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </form>
  );
}
