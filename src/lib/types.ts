export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABEL_KO: Record<Day, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

export const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL_KO: Record<Status, string> = {
  NOT_STARTED: "시작 전",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};

export interface Task {
  id: string;
  content: string;
  day: Day;
  /** ISO date string (yyyy-MM-dd) of the Monday that starts this task's week */
  weekStart: string;
  status: Status;
  author: string;
  /** Free-form notes, edited from the task detail page. */
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskInput = {
  content: string;
  day: Day;
  weekStart: string;
  author: string;
};

export type TaskUpdate = Partial<{
  content: string;
  day: Day;
  status: Status;
  memo: string;
}>;
