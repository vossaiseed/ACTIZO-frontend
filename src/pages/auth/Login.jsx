import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowRight, FiLock, FiAlertCircle, FiShield, FiEye, FiEyeOff } from 'react-icons/fi'
import { loginWithPin, selectAuthStatus } from '@/redux/slices/authSlice'
import { ROLES } from '@/constants/roles'
import { useToast } from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const PIN_LENGTH = 6

/* ---------------- Segmented 6-digit PIN input ---------------- */
function PinInput({ value, onChange, onComplete, invalid, disabled }) {
  const refs = useRef([])

  const setDigit = (i, digit) => {
    const arr = value.split('')
    arr[i] = digit
    const joined = arr.join('').slice(0, PIN_LENGTH)
    onChange(joined)
    return joined
  }

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    if (!digit) return
    const joined = setDigit(i, digit)
    if (i < PIN_LENGTH - 1) refs.current[i + 1]?.focus()
    if (joined.length === PIN_LENGTH && !joined.includes('')) onComplete?.(joined)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (value[i]) setDigit(i, '')
      else if (i > 0) {
        setDigit(i - 1, '')
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (!text) return
    e.preventDefault()
    onChange(text)
    refs.current[Math.min(text.length, PIN_LENGTH - 1)]?.focus()
    if (text.length === PIN_LENGTH) onComplete?.(text)
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`PIN digit ${i + 1}`}
          className={cn(
            'h-14 w-full rounded-2xl border-2 bg-white text-center font-display text-xl font-bold text-ink shadow-sm outline-none transition-all duration-200',
            'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15',
            'dark:bg-slate-800 dark:text-slate-100',
            invalid
              ? 'border-rose-400 ring-2 ring-rose-500/20 dark:border-rose-500'
              : value[i]
                ? 'border-brand-400 dark:border-brand-500/70'
                : 'border-line dark:border-slate-700',
            disabled && 'opacity-60',
          )}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const status = useSelector(selectAuthStatus)
  const isLoading = status === 'loading'

  const [roleKey, setRoleKey] = useState(ROLES[0].key)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showPins, setShowPins] = useState(false)

  const selectedRole = ROLES.find((r) => r.key === roleKey)

  useEffect(() => setError(''), [roleKey])

  const submit = async (pinValue = pin) => {
    if (!roleKey) return setError('Please select a role to continue.')
    if (pinValue.length !== PIN_LENGTH) return setError('Enter your 6-digit PIN.')
    setError('')
    try {
      const user = await dispatch(loginWithPin({ roleKey, pin: pinValue })).unwrap()
      toast.success(`Signed in as ${user.roleLabel}.`, { title: 'Welcome to ACTIZO' })
      navigate(user.redirect || '/', { replace: true })
    } catch (msg) {
      const message = typeof msg === 'string' ? msg : 'Invalid PIN. Please try again.'
      setError(message)
      setPin('')
      toast.error(message, { title: 'Authentication failed' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/95 p-7 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 sm:p-9">
        {/* top accent glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />

        {/* Brand mark */}
        <div className="relative mb-6 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow ring-1 ring-white/30">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
              <path d="M5 19 12 5l7 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 14.5h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink dark:text-slate-100">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
            Sign in to your ACTIZO workspace
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="relative space-y-5"
          noValidate
        >
          {/* Role segmented toggle */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">
              Select your role
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-muted p-1.5 dark:bg-slate-800/80">
              {ROLES.map((role) => {
                const Icon = role.icon
                const active = roleKey === role.key
                return (
                  <button
                    type="button"
                    key={role.key}
                    onClick={() => setRoleKey(role.key)}
                    className="relative rounded-xl px-1 py-2.5 text-center transition-colors"
                  >
                    {active && (
                      <motion.span
                        layoutId="role-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-line dark:bg-slate-700 dark:ring-slate-600"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10 flex flex-col items-center gap-1.5">
                      <Icon className={cn('h-5 w-5', active ? 'text-brand-600 dark:text-brand-300' : 'text-ink-faint dark:text-slate-500')} />
                      <span className={cn('text-[11px] font-semibold leading-tight', active ? 'text-ink dark:text-slate-100' : 'text-ink-soft dark:text-slate-400')}>
                        {role.label}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft dark:text-slate-400">
              <FiShield className="h-3.5 w-3.5 text-brand-500" />
              {selectedRole?.description}
            </p>
          </div>

          {/* PIN */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">
              <FiLock className="h-3.5 w-3.5" />
              6-digit PIN
            </label>
            <PinInput
              value={pin}
              onChange={(v) => {
                setPin(v)
                if (error) setError('')
              }}
              onComplete={(full) => submit(full)}
              invalid={Boolean(error)}
              disabled={isLoading}
            />
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400"
                >
                  <FiAlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Button type="submit" size="lg" fullWidth loading={isLoading} rightIcon={!isLoading ? <FiArrowRight /> : undefined}>
            {isLoading ? 'Verifying…' : `Sign in as ${selectedRole?.label || 'user'}`}
          </Button>
        </form>

        {/* Demo PINs */}
        <div className="relative mt-6 border-t border-line pt-5 dark:border-slate-800">
          <div className="mb-2.5 flex items-center justify-center gap-2">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">
              Demo access — tap to fill
            </p>
            <button
              type="button"
              onClick={() => setShowPins((s) => !s)}
              aria-label={showPins ? 'Hide demo PINs' : 'Show demo PINs'}
              aria-pressed={showPins}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800"
            >
              {showPins ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
              {showPins ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((role) => (
              <button
                type="button"
                key={role.key}
                onClick={() => {
                  setRoleKey(role.key)
                  setPin(role.pin)
                  setError('')
                }}
                className="rounded-xl bg-surface-muted/70 px-2 py-2 text-center transition hover:bg-brand-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
              >
                <span className="block text-[10px] font-medium text-ink-soft dark:text-slate-400">{role.label}</span>
                <span className="block font-display text-sm font-bold tracking-widest text-brand-600 dark:text-brand-300">
                  {showPins ? role.pin : '••••••'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
