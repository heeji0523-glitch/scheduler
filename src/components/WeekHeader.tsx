"use client";

export default function WeekHeader({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label="이전 주"
          className="rounded-lg border border-base-border px-2.5 py-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          ←
        </button>
        <button
          onClick={onNext}
          aria-label="다음 주"
          className="rounded-lg border border-base-border px-2.5 py-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          →
        </button>
      </div>
      <h1 className="text-lg font-semibold text-white sm:text-xl">{label}</h1>
      {onToday ? (
        <button
          onClick={onToday}
          className="rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          오늘
        </button>
      ) : (
        <div className="w-[52px]" />
      )}
    </div>
  );
}
