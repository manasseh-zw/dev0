"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  FilterIcon, 
  Tick01Icon, 
  CircleIcon, 
  Flag01Icon, 
  Calendar01Icon, 
  UserIcon, 
  SortingAZ01Icon 
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sortOptions = [
  { id: "status", name: "Sort by status", icon: CircleIcon },
  { id: "priority", name: "Sort by priority", icon: Flag01Icon },
  { id: "date", name: "Sort by date", icon: Calendar01Icon },
  { id: "assignee", name: "Sort by assignee", icon: UserIcon },
  { id: "alphabetical", name: "Sort alphabetically", icon: SortingAZ01Icon },
];

export function TaskSort() {
  const [selectedSort, setSelectedSort] = React.useState("status");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="secondary" size="sm" className="sm:gap-2">
          <HugeiconsIcon icon={FilterIcon} className="size-4" />
          <span className="hidden sm:inline">Sort</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <HugeiconsIcon icon={FilterIcon} className="size-4" />
          Sort options
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setSelectedSort(option.id)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={Icon} className="size-4 text-muted-foreground" />
                <span>{option.name}</span>
              </div>
              {selectedSort === option.id && (
                <HugeiconsIcon icon={Tick01Icon} className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

