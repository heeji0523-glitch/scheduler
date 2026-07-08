import { DAYS, Day } from "./types";

export const DAY_OFFSET: Record<Day, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a local Date (no time component semantics) as yyyy-MM-dd. */
export function formatISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a yyyy-MM-dd string into a local-midnight Date (avoids UTC shift bugs). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/** Monday of the week containing `date` (week starts Monday, ends Sunday). */
export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function todayWeekStartISO(): string {
  return formatISO(getMonday(new Date()));
}

/** Actual calendar date (yyyy-MM-dd) for a task given its week's Monday + weekday. */
export function taskDateISO(weekStartISO: string, day: Day): string {
  const monday = parseISO(weekStartISO);
  return formatISO(addDays(monday, DAY_OFFSET[day]));
}

/**
 * "N주차" = the Nth Monday-start week whose Monday falls within `weekStart`'s month.
 * e.g. the first Monday of July starts July's 1st week.
 */
export function getWeekNumberInMonth(weekStart: Date): number {
  const month = weekStart.getMonth();
  const year = weekStart.getFullYear();
  let cursor = new Date(year, month, 1);
  let weekNo = 0;
  const target = formatISO(weekStart);
  while (cursor.getMonth() === month) {
    if (cursor.getDay() === 1) {
      weekNo++;
      if (formatISO(cursor) === target) return weekNo;
    }
    cursor = addDays(cursor, 1);
  }
  return Math.max(weekNo, 1);
}

export interface WeekInfo {
  year: number;
  month: number; // 1-12
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  weekStartISO: string;
  rangeLabel: string; // "6/29~7/5"
  headerLabel: string; // "7월 2주차 (6/29~7/5)"
}

export function getWeekInfo(weekStart: Date): WeekInfo {
  const weekEnd = addDays(weekStart, 6);
  const month = weekStart.getMonth() + 1;
  const year = weekStart.getFullYear();
  const weekNumber = getWeekNumberInMonth(weekStart);
  const rangeLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
  const headerLabel = `${month}월 ${weekNumber}주차 (${rangeLabel})`;
  return {
    year,
    month,
    weekNumber,
    weekStart,
    weekEnd,
    weekStartISO: formatISO(weekStart),
    rangeLabel,
    headerLabel,
  };
}

export function getWeekInfoFromISO(weekStartISO: string): WeekInfo {
  return getWeekInfo(parseISO(weekStartISO));
}

/** Full Mon-Sun weeks covering the given month, including padding from adjacent months. */
export function getMonthGrid(year: number, month: number /* 1-12 */): Date[][] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const start = getMonday(firstOfMonth);
  const lastWeekMonday = getMonday(lastOfMonth);
  const gridEnd = addDays(lastWeekMonday, 6);

  const weeks: Date[][] = [];
  let cur = start;
  while (cur.getTime() <= gridEnd.getTime()) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cur);
      cur = addDays(cur, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function isSameMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

/** Weekday of `date` as our Day union (MON..SUN), independent of JS's Sun-first order. */
export function dayOfWeek(date: Date): Day {
  const jsDay = date.getDay(); // 0 = Sun
  return DAYS[(jsDay + 6) % 7];
}

/** Current weekday as our Day union (MON..SUN). */
export function todayDay(): Day {
  return dayOfWeek(new Date());
}

export function isToday(date: Date): boolean {
  const t = new Date();
  return (
    date.getFullYear() === t.getFullYear() &&
    date.getMonth() === t.getMonth() &&
    date.getDate() === t.getDate()
  );
}
