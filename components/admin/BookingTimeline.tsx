"use client";

import { useState } from "react";
import {
  Clock,
  CheckCircle,
  Package,
  Camera,
  Edit3,
  CheckSquare,
  Layers,
  Trophy,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "processing", label: "Processing", icon: Clock, color: "blue" },
  { id: "booked", label: "Booked", icon: CheckCircle, color: "emerald" },
  { id: "preparing", label: "Preparing", icon: Package, color: "amber" },
  { id: "on_shoot", label: "On Shoot", icon: Camera, color: "purple" },
  { id: "editing", label: "Editing", icon: Edit3, color: "cyan" },
  { id: "end_of_editing", label: "End of Editing", icon: CheckSquare, color: "indigo" },
  { id: "finalizing", label: "Finalizing", icon: Layers, color: "pink" },
  { id: "completed", label: "Completed", icon: Trophy, color: "green" },
];

interface TimelineEntry {
  stage: string;
  status: "completed" | "current" | "pending";
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
}

interface BookingTimelineProps {
  bookingId: string;
  currentStage: string;
  timeline?: TimelineEntry[];
  onStageUpdate?: (stage: string, notes?: string) => void;
  isAdmin?: boolean;
}

export default function BookingTimeline({
  bookingId,
  currentStage,
  timeline = [],
  onStageUpdate,
  isAdmin = false,
}: BookingTimelineProps) {
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [stageNotes, setStageNotes] = useState("");

  const getCurrentStageIndex = () => {
    return STAGES.findIndex((s) => s.id === currentStage);
  };

  const getStageStatus = (stageId: string): "completed" | "current" | "pending" => {
    const currentIndex = getCurrentStageIndex();
    const stageIndex = STAGES.findIndex((s) => s.id === stageId);

    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "current";
    return "pending";
  };

  const getTimelineEntry = (stageId: string) => {
    return timeline.find((t) => t.stage === stageId);
  };

  const handleStageClick = (stageId: string) => {
    if (!isAdmin) return;
    setShowNotes(stageId);
    const entry = getTimelineEntry(stageId);
    setStageNotes(entry?.notes || "");
  };

  const handleUpdateStage = (stageId: string) => {
    if (onStageUpdate) {
      onStageUpdate(stageId, stageNotes);
    }
    setShowNotes(null);
    setStageNotes("");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Order Timeline
        </h3>
        {isAdmin && (
          <p className="text-xs text-zinc-500">Click stages to update</p>
        )}
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-zinc-800" />

        {/* Timeline Steps */}
        <div className="space-y-4">
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const status = getStageStatus(stage.id);
            const entry = getTimelineEntry(stage.id);
            const isCompleted = status === "completed";
            const isCurrent = status === "current";
            const isPending = status === "pending";

            return (
              <div key={stage.id} className="relative">
                <div
                  className={cn(
                    "flex items-start gap-4 group",
                    isAdmin && !isCompleted && "cursor-pointer"
                  )}
                  onClick={() => isAdmin && !isCompleted && handleStageClick(stage.id)}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                      isCompleted &&
                        `bg-${stage.color}-500 border-${stage.color}-500 text-white`,
                      isCurrent &&
                        `bg-${stage.color}-500/20 border-${stage.color}-500 text-${stage.color}-400 ring-4 ring-${stage.color}-500/10`,
                      isPending &&
                        "bg-zinc-900 border-zinc-700 text-zinc-600",
                      isAdmin && !isCompleted && "group-hover:scale-110"
                    )}
                    style={{
                      ...(isCompleted && {
                        backgroundColor: `var(--${stage.color}-500)`,
                        borderColor: `var(--${stage.color}-500)`,
                      }),
                      ...(isCurrent && {
                        backgroundColor: `rgba(var(--${stage.color}-500-rgb), 0.2)`,
                        borderColor: `var(--${stage.color}-500)`,
                      }),
                    }}
                  >
                    <StageIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5 pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p
                          className={cn(
                            "font-medium",
                            isCompleted && "text-white",
                            isCurrent && `text-${stage.color}-400`,
                            isPending && "text-zinc-500"
                          )}
                        >
                          {stage.label}
                        </p>
                        {entry?.startedAt && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Started: {formatDate(entry.startedAt)}
                          </p>
                        )}
                        {entry?.completedAt && (
                          <p className="text-xs text-emerald-400 mt-1">
                            Completed: {formatDate(entry.completedAt)}
                          </p>
                        )}
                      </div>

                      {isCurrent && isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStage = STAGES[index + 1];
                            if (nextStage) {
                              handleStageClick(nextStage.id);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium transition-colors"
                        >
                          Move to Next Stage
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {entry?.notes && (
                      <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3 h-3 text-zinc-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-zinc-400">{entry.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Modal */}
                {showNotes === stage.id && isAdmin && (
                  <div className="mt-3 p-4 bg-zinc-800/80 border border-zinc-700 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-medium mb-2">
                      Update to: {stage.label}
                    </h4>
                    <textarea
                      value={stageNotes}
                      onChange={(e) => setStageNotes(e.target.value)}
                      placeholder="Add notes for this stage (optional)..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateStage(stage.id)}
                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium transition-colors"
                      >
                        Update Stage
                      </button>
                      <button
                        onClick={() => {
                          setShowNotes(null);
                          setStageNotes("");
                        }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 p-4 bg-zinc-800/30 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Overall Progress</span>
          <span className="text-sm font-medium text-white">
            {Math.round(((getCurrentStageIndex() + 1) / STAGES.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-amber-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${((getCurrentStageIndex() + 1) / STAGES.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
