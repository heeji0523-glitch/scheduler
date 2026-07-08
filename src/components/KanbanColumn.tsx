"use client";

import TaskCard from "./TaskCard";
import { Status, STATUS_LABEL_KO, Task } from "@/lib/types";

const HEADER_ACCENT: Record<Status, string> = {
  NOT_STARTED: "text-white/70",
  IN_PROGRESS: "text-amber-300",
  DONE: "text-emerald-300",
};

export default function KanbanColumn({
  status,
  tasks,
  onRemove,
  overdueLabelFor,
}: {
  status: Status;
  tasks: Task[];
  onRemove: (id: string) => void;
  overdueLabelFor?: (task: Task) => string | undefined;
}) {
  return (
    <div className="flex min-h-[200px] flex-1 flex-col rounded-2xl border border-base-border bg-base-panel/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${HEADER_ACCENT[status]}`}>
          {STATUS_LABEL_KO[status]}
          <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] font-normal text-white/50">
            {tasks.length}
          </span>
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-base-border py-6 text-center text-xs text-white/30">
            할일 없음
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onRemove={onRemove}
              overdueLabel={overdueLabelFor?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
