"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddTaskBar({ onAdded }: { onAdded: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    const [title, model, , dueDate] = raw.split("/").map((s) => s.trim());
    if (!title) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          model: model || undefined,
          dueDate: dueDate || undefined,
        }),
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
    <form onSubmit={handleSubmit} className="border-border flex flex-wrap items-center gap-2 border-t px-6 py-3">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="업무 추가 — 업무명 / 모델명 / 담당자 / 완료예상일(YYYY-MM-DD)"
        aria-label="새 업무 정보"
        autoComplete="off"
        className="min-w-45 flex-1"
      />
      <Button type="submit" disabled={submitting || !value.trim()}>
        등록
      </Button>
      {error && (
        <p role="alert" aria-live="polite" className="text-destructive basis-full text-xs">
          {error}
        </p>
      )}
    </form>
  );
}
