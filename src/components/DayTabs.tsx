"use client";

import { DAYS, DAY_LABEL_KO, Day } from "@/lib/types";

export default function DayTabs({
  value,
  onChange,
  dateFor,
  countFor,
  todayDay,
}: {
  value: Day;
  onChange: (day: Day) => void;
  dateFor?: (day: Day) => string;
  countFor?: (day: Day) => number;
  todayDay?: Day | null;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-base-panel p-1">
      {DAYS.map((day) => {
        const active = day === value;
        const isToday = day === todayDay;
        return (
          <button
            key={day}
            onClick={() => onChange(day)}
            className={`relative flex min-w-[3.2rem] flex-1 flex-col items-center rounded-xl px-2 py-2 text-sm font-medium transition ${
              active ? "bg-white text-black" : "text-white/60 hover:text-white"
            }`}
          >
            <span>
              {DAY_LABEL_KO[day]}
              {isToday && (
                <span
                  className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${
                    active ? "bg-black" : "bg-emerald-400"
                  }`}
                />
              )}
            </span>
            {dateFor && (
              <span className={`text-[10px] ${active ? "text-black/60" : "text-white/40"}`}>
                {dateFor(day)}
              </span>
            )}
            {countFor && countFor(day) > 0 && (
              <span
                className={`absolute -top-1 -right-1 rounded-full px-1 text-[9px] ${
                  active ? "bg-black text-white" : "bg-white/20 text-white/80"
                }`}
              >
                {countFor(day)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
