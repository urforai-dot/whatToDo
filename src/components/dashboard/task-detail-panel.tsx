"use client";

import { useEffect, useRef, useState } from "react";
import type { Owner, TaskDetail } from "@/lib/dashboard-types";
import { STATUS_LABEL } from "@/lib/dashboard-types";
import { TASK_STATUSES } from "@/db/schema";
import { Widget, EmptyRow } from "@/components/dashboard/widget";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TaskDetailPanel({
  taskId,
  onBack,
  onChanged,
}: {
  taskId: number;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [allUsers, setAllUsers] = useState<Owner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Guards against an older load() landing after a newer one (e.g. a slow
  // response to the initial load resolving after a subsequent patch's
  // reload) and repainting stale detail/owners over fresher state.
  const requestSeq = useRef(0);

  async function load() {
    const seq = ++requestSeq.current;
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("업무를 불러오지 못했습니다.");
      const data = await res.json();
      if (seq !== requestSeq.current) return;
      setDetail(data);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : "업무를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null); // clear stale detail while the new task's fetch resolves
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAllUsers)
      .catch(() => setAllUsers([]));
  }, []);

  function toggleOwner(userId: number) {
    if (!detail) return;
    const current = detail.owners.map((o) => o.id);
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    patchTask({ ownerIds: next });
  }

  async function patchTask(body: Record<string, unknown>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("수정에 실패했습니다.");
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setUpdating(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "코멘트 등록에 실패했습니다.");
      }
      setCommentBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "코멘트 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Widget title={detail?.title ?? "업무 상세"} count={detail ? `${detail.comments.length}건` : undefined}>
      <button type="button" onClick={onBack} className="text-accent px-3.5 pt-2 text-left text-[11px] hover:underline">
        ← 전체 목록으로
      </button>

      {error && (
        <p role="alert" aria-live="polite" className="text-destructive px-3.5 py-2 text-xs">
          {error}
        </p>
      )}

      {detail && (
        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2">
          <Select
            value={detail.status}
            onValueChange={(v) => v && patchTask({ status: v })}
            disabled={updating}
          >
            <SelectTrigger aria-label="상태" size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(detail.priority)}
            onValueChange={(v) => v && patchTask({ priority: Number(v) })}
            disabled={updating}
          >
            <SelectTrigger aria-label="우선순위" size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((p) => (
                <SelectItem key={p} value={String(p)}>
                  P{p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {detail && allUsers.length > 0 && (
        <div className="border-border/60 flex flex-wrap gap-1.5 border-b px-3.5 pb-2.5" role="group" aria-label="담당자 배정">
          {allUsers.map((u) => {
            const assigned = detail.owners.some((o) => o.id === u.id);
            return (
              <button
                key={u.id}
                type="button"
                disabled={updating}
                aria-pressed={assigned}
                onClick={() => toggleOwner(u.id)}
                className={cn(
                  "border px-2 py-0.5 text-[11px]",
                  assigned
                    ? "bg-accent text-foreground border-accent"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      )}

      {!detail && !error && <EmptyRow>불러오는 중...</EmptyRow>}

      {detail && detail.comments.length === 0 && (
        <EmptyRow>아직 코멘트가 없습니다. 진행 상황을 남겨보세요.</EmptyRow>
      )}
      {detail?.comments.map((c) => (
        <div key={c.id} className="border-border/60 border-b px-3.5 py-2 last:border-b-0">
          <div className="text-muted-foreground mb-0.5 text-[10px] tracking-wide uppercase">
            {c.authorName} · {c.createdAt.slice(0, 16).replace("T", " ")}
          </div>
          <div className="text-[12.5px] leading-relaxed">{c.body}</div>
        </div>
      ))}

      <form onSubmit={submitComment} className="border-border flex gap-2 border-t px-3.5 py-2.5">
        <Textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder={detail ? `${detail.title}에 코멘트 추가` : "코멘트 추가"}
          aria-label="코멘트 내용"
          autoComplete="off"
          className="min-h-16 flex-1"
        />
        <Button type="submit" disabled={submitting || !commentBody.trim()}>
          등록
        </Button>
      </form>
    </Widget>
  );
}
