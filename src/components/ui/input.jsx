import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref__={ref}
    className={cn("flex h-10 w-full rounded-md border px-3 py-2 text-sm", className)}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }