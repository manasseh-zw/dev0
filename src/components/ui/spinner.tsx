import { cn } from "@/lib/utils"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, HugeiconsProps } from "@hugeicons/react"

function Spinner({ className, ...props }: Omit<HugeiconsProps, "icon">) {
  return (
    <HugeiconsIcon 
      icon={Loading03Icon} 
      role="status" 
      aria-label="Loading" 
      className={cn("size-4 animate-spin", className)} 
      {...props} 
    />
  )
}

export { Spinner }
