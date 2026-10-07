import { type ReactElement, type ReactNode, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type ConfirmDialogProps = {
  trigger: ReactElement
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  pendingLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pendingLabel = 'Please wait…',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      setOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not complete this action. Please try again.')
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, details) => {
        if (inFlight.current) {
          details.cancel()
          return
        }
        setError(null)
        setOpen(nextOpen)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} aria-busy={pending} initialFocus={cancelRef}>
        <DialogHeader className="pr-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose disabled={pending} render={<Button ref={cancelRef} type="button" variant="outline" />}>
            {cancelLabel}
          </DialogClose>
          <Button type="button" variant={variant} disabled={pending} onClick={confirm}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
