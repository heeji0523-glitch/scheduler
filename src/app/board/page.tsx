"use client";

import { useEffect, useMemo, useState } from "react";
import DayTabs from "@/components/DayTabs";
import KanbanColumn from "@/components/KanbanColumn";
import QuickAddInput from "@/components/QuickAddInput";
import WeekHeader from "@/components/WeekHeader";
import { useAuthor } from "@/components/AuthorProvider";
import { createTask, fetchTasks, patchTask } from "@/lib/api";
import { DAY_LABEL_KO, STATUSES, Day, Status, Task } from "@/lib/types";
import {
  addDays,
  formatISO,
  getMonday,
  getWeekInfoFromISO,
  parseISO,
  taskDateISO,
  todayDay,
  todayWeekStartISO,
} from "@/lib/week";

export default function BoardPage() {
  const { author } = useAuthor();
  const [weekStartISO, setWeekStartISO] = useState(todayWeekStartISO());
  const [selectedDay, setSelectedDay] = useState<Day>(todayDay());
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

  const dayTasks = tasks.filter((t) => t.day === selectedDay);

  function tasksByStatus(status: Status) {
    return dayTasks.filter((t) => t.status === status);
  }

  function countFor(day: Day) {
    return tasks.filter((t) => t.day === day).length;
  }

  function dateFor(day: Day) {
    const iso = taskDateISO(weekStartISO, day);
    const d = parseISO(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  async function handleAdd(content: string) {
    if (!author) return;
    const task = await createTask({
      content,
      day: selectedDay,
      weekStart: weekStartISO,
      author,
    });
    setTasks((prev) => [...prev, task]);
  }

  async function handleDropTask(id: string, status: Status) {
    const target = tasks.find((t) => t.id === id);
    if (!target || target.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const updated = await patchTask(id, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? target : t)));
    }
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
          isCurrentWeek
            ? undefined
            : () => setWeekStartISO(todayWeekStartISO())
        }
      />

      <DayTabs
        value={selectedDay}
        onChange={setSelectedDay}
        dateFor={dateFor}
        countFor={countFor}
        todayDay={isCurrentWeek ? todayDay() : null}
      />

      <QuickAddInput
        placeholder={`${DAY_LABEL_KO[selectedDay]}요일 할일을 입력하고 Enter`}
        onAdd={handleAdd}
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onDropTask={handleDropTask}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
