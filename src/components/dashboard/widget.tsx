export function Widget({
  title,
  count,
  children,
  footer,
}: {
  title: string;
  count?: string | number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="bg-card border-border flex flex-col border">
      <div className="border-border flex items-center gap-2 border-b px-3.5 py-2">
        <span className="bg-accent size-2 flex-none" aria-hidden />
        <h2 className="font-heading text-[13.5px] font-semibold">{title}</h2>
        {count !== undefined && <span className="text-muted-foreground ml-auto text-[11px]">{count}</span>}
      </div>
      <div className="flex flex-col">{children}</div>
      {footer}
    </section>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground px-3.5 py-4 text-xs">{children}</p>;
}
