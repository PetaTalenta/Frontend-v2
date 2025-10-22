import React, { useState, useRef, useEffect } from "react"

interface SimpleAlertDialogProps {
  title: string
  description: string
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  trigger: React.ReactNode
}

export function SimpleAlertDialog({
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  trigger
}: SimpleAlertDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleConfirm = () => {
    onConfirm?.()
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleCancel} />
          <div ref={dialogRef} className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{description}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Compatibility components for existing API
export function AlertDialog({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogAction({ children, onClick, className, disabled }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 ${className || ''}`}
    >
      {children}
    </button>
  )
}

export function AlertDialogCancel({ children, onClick, disabled }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
    >
      {children}
    </button>
  )
}