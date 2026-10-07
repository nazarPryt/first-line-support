import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

type StyledProps<Props> = Omit<Props, 'className'> & { className?: string }

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: StyledProps<DialogPrimitive.Popup.Props> & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-xl border bg-card p-6 text-card-foreground shadow-lg outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-3"
                aria-label="Close dialog"
              />
            }
          >
            <X />
          </DialogClose>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('space-y-2 pr-6', className)} {...props} />
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

function DialogTitle({ className, ...props }: StyledProps<DialogPrimitive.Title.Props>) {
  return <DialogPrimitive.Title className={cn('font-heading text-lg font-semibold', className)} {...props} />
}

function DialogDescription({ className, ...props }: StyledProps<DialogPrimitive.Description.Props>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm leading-relaxed text-muted-foreground', className)}
      {...props}
    />
  )
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }
