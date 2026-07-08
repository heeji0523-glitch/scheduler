"use client";

import { useEffect, useMemo, useState } from "react";
import DayTabs from "@/components/DayTabs";
import KanbanColumn from "@/components/KanbanColumn";
import QuickAddInput from "@/components/QuickAddInput";
import WeekHeader from "@/components/WeekHeader";
import { useAuthor } from "@/components/AuthorProvider";
import { createTask, fetchTasks } from "@/lib/api";
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

const todayISO = formatISO(new Date());

export default function BoardPage() {
  const { author } = useAuthor();
  const [weekStartISO, setWeekStartISO] = useState(todayWeekStartISO());
  const [selectedDay, setSelectedDay] = useState<Day>(todayDay());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const weekInfo = useMemo(() => getWeekInfoFromISO(weekStartISO), [weekStartISO]);
  const isCurrentWeek = weekStartISO === todayWeekStartISO();
  const isTodayTab = isCurrentWeek && selectedDay === todayDay();

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

  // Unfinished tasks whose day has already passed "carry over" onto today's
  // tab so nothing gets forgotten just because its original day ended.
  useEffect(() => {
    let cancelled = false;
    fetchTasks({
      overdueBefore: todayISO,
      statusIn: ["NOT_STARTED", "IN_PROGRESS"],
    }).then((data) => {
      if (!cancelled) setOverdueTasks(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function shiftWeek(deltaDays: number) {
    const base = getMonday(parseISO(weekStartISO));
    setWeekStartISO(formatISO(addDays(base, deltaDays)));
  }

  const dayTasks = useMemo(() => {
    const own = tasks.filter((t) => t.day === selectedDay);
    if (!isTodayTab) return own;
    const ids = new Set(own.map((t) => t.id));
    const carried = overdueTasks.filter((t) => !ids.has(t.id));
    return [...carried, ...own];
  }, [tasks, overdueTasks, selectedDay, isTodayTab]);

  function tasksByStatus(status: Status) {
    return dayTasks.filter((t) => t.status === status);
  }

  function countFor(day: Day) {
    const base = tasks.filter((t) => t.day === day).length;
    if (isCurrentWeek && day === todayDay()) return base + overdueTasks.length;
    return base;
  }

  function dateFor(day: Day) {
    const iso = taskDateISO(weekStartISO, day);
    const d = parseISO(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function overdueLabelFor(task: Task): string | undefined {
    if (!isTodayTab) return undefined;
    const iso = taskDateISO(task.weekStart, task.day);
    if (iso >= todayISO) return undefined;
    const d = parseISO(iso);
    return `${d.getMonth() + 1}/${d.getDate()}부터`;
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

  function handleRemove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setOverdueTasks((prev) => prev.filter((t) => t.id !== id));
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
              onRemove={handleRemove}
              overdueLabelFor={overdueLabelFor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
