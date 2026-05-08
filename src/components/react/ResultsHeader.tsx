interface Props {
  shown: number;
  total: number;
}

export default function ResultsHeader({ shown, total }: Props) {
  const message = shown === total
    ? `Showing all ${total} foods`
    : `Showing ${shown} of ${total} foods`;
  return (
    <p className="text-sm text-slate-500" aria-live="polite">{message}</p>
  );
}
