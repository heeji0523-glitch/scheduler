"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import WeekHeader from "@/components/WeekHeader";
import { fetchTasks } from "@/lib/api";
import { DAY_LABEL_KO, DAYS, Task } from "@/lib/types";
import { addDays, formatISO, getMonthGrid, isSameMonth, isToday, parseISO } from "@/lib/week";

function todayYearMonth() {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() + 1 };
}

export default function MonthlyPage() {
  const [{ year, month }, setYm] = useState(todayYearMonth());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const weekStarts = useMemo(() => grid.map((week) => formatISO(week[0])), [grid]);
  const today = todayYearMonth();
  const isCurrentMonth = today.year === year && today.month === month;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTasks({ weeks: weekStarts })
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // weekStarts is derived from year/month, safe as dep via join
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStarts.join(",")]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const week of grid) {
      for (const date of week) {
        map.set(formatISO(date), []);
      }
    }
    for (const task of tasks) {
      // recompute the calendar date for this task from weekStart + day
      const idx = DAYS.indexOf(task.day);
      const monday = parseISO(task.weekStart);
      const d = addDays(monday, idx);
      const iso = formatISO(d);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push(task);
    }
    return map;
  }, [tasks, grid]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYm({ year: y, month: m });
  }

  return (
    <div className="space-y-5">
      <WeekHeader
        label={`${year}년 ${month}월`}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={isCurrentMonth ? undefined : () => setYm(todayYearMonth())}
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">불러오는 중...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-base-border">
          <div className="grid grid-cols-7 bg-base-panel text-center text-xs font-medium text-white/50">
            {DAYS.map((day) => (
              <div key={day} className="py-2">
                {DAY_LABEL_KO[day]}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.flat().map((date) => {
              const iso = formatISO(date);
              const dayTasks = tasksByDate.get(iso) ?? [];
              const doneCount = dayTasks.filter((t) => t.status === "DONE").length;
              const inMonth = isSameMonth(date, year, month);
              const rate = dayTasks.length ? Math.round((doneCount / dayTasks.length) * 100) : null;

              return (
                <Link
                  key={iso}
                  href={`/day/${iso}`}
                  className={`flex min-h-[84px] flex-col gap-1 border-b border-r border-base-border/70 p-2 transition hover:bg-white/5 sm:min-h-[104px] ${
                    inMonth ? "bg-base-bg" : "bg-base-bg/40"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      isToday(date)
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-white font-semibold text-black"
                        : inMonth
                          ? "text-white/70"
                          : "text-white/25"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="mt-auto space-y-1">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40">
                        {doneCount}/{dayTasks.length} 완료
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
