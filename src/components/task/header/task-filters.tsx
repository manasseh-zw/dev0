"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Settings01Icon, 
  Tick01Icon, 
  Layers01Icon, 
  StarIcon, 
  InformationCircleIcon, 
  HexagonIcon, 
  MinusSignIcon, 
  UserGroupIcon, 
  UserIcon, 
  UserBlock01Icon 
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const priorities = [
  { id: "all", name: "All priorities", icon: Layers01Icon },
  { id: "urgent", name: "Urgent", icon: StarIcon, color: "text-pink-500" },
  { id: "high", name: "High", icon: InformationCircleIcon, color: "text-red-500" },
  { id: "medium", name: "Medium", icon: HexagonIcon, color: "text-cyan-500" },
  { id: "low", name: "Low", icon: MinusSignIcon, color: "text-gray-400" },
];

const assignees = [
  { id: "all", name: "All assignees", icon: UserGroupIcon },
  { id: "me", name: "Assigned to me", icon: UserIcon },
  { id: "unassigned", name: "Unassigned", icon: UserBlock01Icon },
];

export function TaskFilters() {
  const [open, setOpen] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState("all");
  const [selectedAssignee, setSelectedAssignee] = React.useState("all");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="secondary" size="sm" className="sm:gap-2">
          <HugeiconsIcon icon={Settings01Icon} className="size-4" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <HugeiconsIcon icon={Layers01Icon} className="size-4 text-muted-foreground" />
              Priority
            </h4>
            <div className="space-y-1">
              {priorities.map((priority) => {
                const Icon = priority.icon;
                return (
                  <Button
                    key={priority.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setSelectedPriority(priority.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon
                        icon={Icon}
                        className={`size-4 ${priority.color || "text-muted-foreground"}`}
                      />
                      <span className="text-sm">{priority.name}</span>
                    </div>
                    {selectedPriority === priority.id && (
                      <HugeiconsIcon icon={Tick01Icon} className="size-4 text-primary" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-muted-foreground" />
              Assignee
            </h4>
            <div className="space-y-1">
              {assignees.map((assignee) => {
                const Icon = assignee.icon;
                return (
                  <Button
                    key={assignee.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setSelectedAssignee(assignee.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon icon={Icon} className="size-4 text-muted-foreground" />
                      <span className="text-sm">{assignee.name}</span>
                    </div>
                    {selectedAssignee === assignee.id && (
                      <HugeiconsIcon icon={Tick01Icon} className="size-4 text-primary" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            className="w-full h-9"
            onClick={() => {
              setSelectedPriority("all");
              setSelectedAssignee("all");
            }}
          >
            Clear all filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

