export function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}
