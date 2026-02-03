'use client'

import type { Task } from '@/lib/types'
import type { MockPRDetails } from '@/data/mock/pr-details'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DetailsTab } from './details-tab'
import { ActivityTab } from './activity-tab'
import { InformationCircleIcon, Clock01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import * as React from 'react'

interface ReviewDetailContentProps {
  task: Task
  prDetails: MockPRDetails | null
}

export function ReviewDetailContent({
  task,
  prDetails,
}: ReviewDetailContentProps) {
  const [activeTab, setActiveTab] = React.useState('details')

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="px-6 pt-4 border-b border-border bg-background">
          <TabsList className="w-fit dark:bg-background" variant="line">
            <TabsTrigger value="details">
              <HugeiconsIcon icon={InformationCircleIcon} size={14} />
              Details
            </TabsTrigger>
            <TabsTrigger value="activity">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="details"
          className="flex-1 overflow-y-auto px-8 py-4 m-0"
        >
          <DetailsTab task={task} prDetails={prDetails} />
        </TabsContent>

        <TabsContent
          value="activity"
          className="flex-1 overflow-y-auto px-6 py-4 m-0"
        >
          <ActivityTab task={task} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
