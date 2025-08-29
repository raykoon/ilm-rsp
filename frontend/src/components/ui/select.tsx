import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50" />
  </div>
))
Select.displayName = "Select"

// Advanced Select Components (for complex dropdowns)
interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType>({})

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function SelectRoot({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  
  const currentValue = value !== undefined ? value : internalValue
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange, 
      open, 
      onOpenChange: setOpen 
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => onOpenChange?.(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps {
  placeholder?: string
  className?: string
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, className }, ref) => {
    const { value } = React.useContext(SelectContext)
    return (
      <span ref={ref} className={className}>
        {value || <span className="text-gray-500">{placeholder}</span>}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, className }, ref) => {
    const { open } = React.useContext(SelectContext)
    
    if (!open) return null
    
    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-full left-0 z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95 mt-1",
          className
        )}
      >
        <div className="max-h-60 overflow-auto p-1">
          {children}
        </div>
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className }, ref) => {
    const { onValueChange, onOpenChange } = React.useContext(SelectContext)

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        onClick={() => {
          onValueChange?.(value)
          onOpenChange?.(false)
        }}
      >
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { 
  Select, 
  SelectRoot as Root,
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
}

// Export with standard naming for compatibility
export {
  SelectRoot,
  SelectTrigger as Trigger,
  SelectValue as Value,
  SelectContent as Content,
  SelectItem as Item
}