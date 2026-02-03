"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Settings01Icon, 
  Tick01Icon, 
  Layers01Icon,
  AiCloud02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { reviewStatuses } from "./review-statuses";
import { cn } from "@/lib/utils";

const models = [
  { id: "all", name: "All models", dotClassName: "bg-muted-foreground" },
  { id: "gemini-3-pro-preview", name: "Gemini Pro", dotClassName: "bg-blue-500/80 ring-1 ring-blue-200/70" },
  { id: "gemini-3-flash-preview", name: "Gemini Flash", dotClassName: "bg-amber-400/80 ring-1 ring-amber-200/70" },
];

export function ReviewFilters() {
  const [open, setOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedModel, setSelectedModel] = React.useState("all");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => {
          const { className, ...rest } = props;
          return (
            <Button
              {...rest}
              variant="secondary"
              size="sm"
              className={cn("sm:gap-2", className)}
            >
              <HugeiconsIcon icon={Settings01Icon} className="size-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          );
        }}
      />
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          {/* Status filter */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <HugeiconsIcon icon={Layers01Icon} className="size-4 text-muted-foreground" />
              Status
            </h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-9 px-3"
                onClick={() => setSelectedStatus("all")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">All statuses</span>
                </div>
                {selectedStatus === "all" && (
                  <HugeiconsIcon icon={Tick01Icon} className="size-4 text-primary" />
                )}
              </Button>
              {reviewStatuses.map((status) => {
                const StatusIcon = status.icon;
                return (
                  <Button
                    key={status.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setSelectedStatus(status.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusIcon />
                      <span className="text-sm">{status.name}</span>
                    </div>
                    {selectedStatus === status.id && (
                      <HugeiconsIcon icon={Tick01Icon} className="size-4 text-primary" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Model filter */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <HugeiconsIcon icon={AiCloud02Icon} className="size-4 text-muted-foreground" />
              Model
            </h4>
            <div className="space-y-1">
              {models.map((model) => (
                <Button
                  key={model.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-9 px-3"
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`size-2 rounded-full ${model.dotClassName}`} />
                    <span className="text-sm">{model.name}</span>
                  </div>
                  {selectedModel === model.id && (
                    <HugeiconsIcon icon={Tick01Icon} className="size-4 text-primary" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            className="w-full h-9"
            onClick={() => {
              setSelectedStatus("all");
              setSelectedModel("all");
            }}
          >
            Clear all filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
