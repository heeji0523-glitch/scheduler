"use client";

import { useEffect, useMemo, useState } from "react";
import TaskCard from "@/components/TaskCard";
import QuickAddInput from "@/components/QuickAddInput";
import WeekHeader from "@/components/WeekHeader";
import { useAuthor } from "@/components/AuthorProvider";
import { createTask, fetchTasks } from "@/lib/api";
import { DAYS, DAY_LABEL_KO, Day, Task } from "@/lib/types";
import {
  addDays,
  formatISO,
  getMonday,
  getWeekInfoFromISO,
  isToday,
  parseISO,
  taskDateISO,
  todayWeekStartISO,
} from "@/lib/week";

export default function WeeklyPage() {
  const { author } = useAuthor();
  const [weekStartISO, setWeekStartISO] = useState(todayWeekStartISO());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const weekInfo = useMemo(() => getWeekInfoFromISO(weekStartISO), [weekStartISO]);
  const isCurrentWeek = weekStartISO === todayWeekStartISO();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTasks({ weekStart: weekStartISO })
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStartISO]);

  function shiftWeek(deltaDays: number) {
    const base = getMonday(parseISO(weekStartISO));
    setWeekStartISO(formatISO(addDays(base, deltaDays)));
  }

  function tasksFor(day: Day) {
    return tasks.filter((t) => t.day === day);
  }

  async function handleAdd(day: Day, content: string) {
    if (!author) return;
    const task = await createTask({ content, day, weekStart: weekStartISO, author });
    setTasks((prev) => [...prev, task]);
  }

  function handleChange(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleRemove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-5">
      <WeekHeader
        label={weekInfo.headerLabel}
        onPrev={() => shiftWeek(-7)}
        onNext={() => shiftWeek(7)}
        onToday={
          isCurrentWeek ? undefined : () => setWeekStartISO(todayWeekStartISO())
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {DAYS.map((day) => {
            const iso = taskDateISO(weekStartISO, day);
            const date = parseISO(iso);
            const dayTasks = tasksFor(day);
            const doneCount = dayTasks.filter((t) => t.status === "DONE").length;
            return (
              <div
                key={day}
                className={`flex flex-col gap-2 rounded-2xl border p-3 ${
                  isToday(date) && isCurrentWeek
                    ? "border-white/40 bg-base-panel"
                    : "border-base-border bg-base-panel/60"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    {DAY_LABEL_KO[day]}
                    <span className="ml-1.5 text-xs font-normal text-white/40">
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                  </h3>
                  <span className="text-[11px] text-white/40">
                    {dayTasks.length > 0 ? `${doneCount}/${dayTasks.length} 완료` : ""}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {dayTasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-base-border py-4 text-center text-xs text-white/30">
                      할일 없음
                    </p>
                  ) : (
                    dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onChange={handleChange}
                        onRemove={handleRemove}
                        draggable={false}
                      />
                    ))
                  )}
                </div>

                <QuickAddInput
                  compact
                  placeholder="추가"
                  onAdd={(content) => handleAdd(day, content)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
