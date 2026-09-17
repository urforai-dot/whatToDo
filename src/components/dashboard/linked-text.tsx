const TASK_REF_RE = /#(\d+)/g;

// Splits on #<digits> tokens (git PR/issue-style refs) and renders each as a
// clickable link to that task's detail panel. Doesn't check the id exists —
// an invalid ref just surfaces TaskDetailPanel's own "업무를 불러오지
// 못했습니다" error, which is enough feedback without a second fetch here.
export function LinkedText({ text, onOpenTask }: { text: string; onOpenTask: (id: number) => void }) {
  const parts = text.split(TASK_REF_RE);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <button
            key={i}
            type="button"
            onClick={() => onOpenTask(Number(part))}
            className="text-accent hover:underline"
          >
            #{part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
