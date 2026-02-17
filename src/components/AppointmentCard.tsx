"use client";

import { MapPin, Clock, DollarSign, GripVertical } from "lucide-react";
import { formatTime, currency, cn } from "@/lib/utils";

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  address?: string | null;
  clientName?: string | null;
  sessionRate?: number | null;
  driveTimeMin?: number | null;
  driveDistMiles?: number | null;
}

interface Props {
  appointment: Appointment;
  isPast?: boolean;
  isCurrent?: boolean;
  isDragging?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
}

export default function AppointmentCard({
  appointment: a,
  isPast,
  isCurrent,
  isDragging,
  dragHandleProps,
}: Props) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-4 transition-all",
        isPast && "opacity-50",
        isCurrent && "ring-2 ring-primary border-primary",
        isDragging && "shadow-lg scale-[1.02]",
        !isPast && !isCurrent && "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {dragHandleProps && (
          <div {...dragHandleProps} className="pt-1 cursor-grab active:cursor-grabbing text-gray-300">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm truncate">{a.title}</h3>
            {a.sessionRate && (
              <span className="text-sm font-bold text-success flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                {a.sessionRate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted mb-1">
            <Clock className="w-3 h-3" />
            {formatTime(a.startTime)} – {formatTime(a.endTime)}
          </div>

          {(a.location || a.address) && (
            <div className="flex items-start gap-1 text-xs text-muted">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="truncate">{a.address || a.location}</span>
            </div>
          )}

          {a.driveTimeMin != null && (
            <div className="mt-2 text-xs text-primary font-medium">
              🚗 {a.driveTimeMin} min drive ({a.driveDistMiles} mi)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
