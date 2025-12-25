import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref__={ref}
    className={cn("inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium", className)}
    {...props}
  />
))
Button.displayName = "Button"

export { Button }