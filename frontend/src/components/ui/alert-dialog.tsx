import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertDialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(null)

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function AlertDialog({ open = false, onOpenChange, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

interface AlertDialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)
    
    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: () => context?.onOpenChange(true),
      })
    }

    return (
      <button
        ref={ref}
        onClick={() => context?.onOpenChange(true)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AlertDialogTrigger.displayName = "AlertDialogTrigger"

interface AlertDialogContentProps {
  className?: string
  children: React.ReactNode
}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)

    if (!context?.open) return null

    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-50 bg-black/80" />
        
        {/* Content */}
        <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
          <div
            ref={ref}
            className={cn(
              "grid w-full max-w-lg gap-4 border border-gray-200 bg-white p-6 shadow-lg rounded-lg",
              className
            )}
            {...props}
          >
            {children}
          </div>
        </div>
      </>
    )
  }
)
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = React.forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  )
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = React.forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, { className?: string; children: React.ReactNode }>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
)
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, { className?: string; children: React.ReactNode }>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
)
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
          className
        )}
        onClick={() => {
          props.onClick?.(null as any)
          context?.onOpenChange(false)
        }}
        {...props}
      />
    )
  }
)
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2",
          className
        )}
        onClick={() => {
          props.onClick?.(null as any)
          context?.onOpenChange(false)
        }}
        {...props}
      />
    )
  }
)
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
