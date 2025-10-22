import React, { useState, useRef, useEffect } from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
  forceMount?: boolean
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuSeparatorProps {
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
        {children}
      </DropdownMenuContext.Provider>
    </div>
  )
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = useContext(DropdownMenuContext)
  const triggerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        if (buttonRef.current && !buttonRef.current.contains(target)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  if (asChild) {
    return (
      <div ref={triggerRef} onClick={handleClick}>
        {children}
      </div>
    )
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, align = "end", className, forceMount }: DropdownMenuContentProps) {
  const { isOpen } = useContext(DropdownMenuContext)
  const contentRef = useRef<HTMLDivElement>(null)

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  }

  if (!isOpen && !forceMount) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-md ${alignmentClasses[align]} ${className || ''}`}
      style={{ top: '100%', marginTop: '0.5rem' }}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div className={`px-2 py-1.5 text-sm font-semibold ${className || ''}`}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div className={`h-px my-1 -mx-1 bg-gray-100 ${className || ''}`} />
  )
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  const { setIsOpen } = useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }

  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 ${className || ''}`}
    >
      {children}
    </div>
  )
}

// Helper hook for context
function useContext<T>(context: React.Context<T>): T {
  const contextValue = React.useContext(context)
  if (contextValue === undefined) {
    throw new Error('useContext must be used within a Provider')
  }
  return contextValue
}