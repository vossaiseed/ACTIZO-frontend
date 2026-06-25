import { FiAlertTriangle, FiHelpCircle } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Modal from '@/components/overlay/Modal'

const TONES = {
  danger: {
    badge:
      'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    icon: FiAlertTriangle,
    variant: 'danger',
  },
  brand: {
    badge:
      'bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20',
    icon: FiHelpCircle,
    variant: 'primary',
  },
}

/**
 * ConfirmDialog — a tone-aware confirmation modal built on top of Modal.
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}) => {
  const config = TONES[tone] || TONES.danger
  const Icon = config.icon

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      hideClose
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1',
            config.badge,
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="mt-4 sm:ml-4 sm:mt-0.5">
          <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
