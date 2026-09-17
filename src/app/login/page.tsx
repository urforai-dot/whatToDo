"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = { id: number; name: string };

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("사용자 목록을 불러오지 못했습니다."))))
      .then(setUsers)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(selected) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "로그인에 실패했습니다.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-semibold">섹션 업무 현황판</h1>
        <p className="text-muted-foreground text-sm">본인 이름을 선택해주세요.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <Select value={selected} onValueChange={(value) => setSelected(value ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={users.length ? "이름 선택" : "불러오는 중..."} />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" disabled={!selected || submitting}>
          {submitting ? "확인 중..." : "시작하기"}
        </Button>
      </form>
    </div>
  );
}
