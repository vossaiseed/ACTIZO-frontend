import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSettings,
  FiUser,
  FiSun,
  FiMoon,
  FiBell,
  FiLock,
  FiSave,
  FiCheck,
  FiMail,
  FiBriefcase,
  FiMapPin,
  FiMonitor,
  FiShield,
  FiSmartphone,
  FiFileText,
} from 'react-icons/fi'

import { selectUser } from '@/redux/slices/authSlice'
import { ROLES, REGIONS } from '@/constants'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'

import PageHeader from '@/components/common/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switch from '@/components/ui/Switch'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'

const DEMO_USER = {
  id: 'USR-001',
  name: 'Alex Morgan',
  role: 'Administrator',
  email: 'admin@actizo.com',
  branch: 'Head Office — Dubai',
  avatarColor: 'from-brand-400 to-brand-600',
}

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: FiUser, description: 'Personal information' },
  { key: 'appearance', label: 'Appearance', icon: FiMonitor, description: 'Theme & accent' },
  { key: 'notifications', label: 'Notifications', icon: FiBell, description: 'Alerts & emails' },
  { key: 'security', label: 'Security', icon: FiShield, description: 'Password & access' },
]

const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: 'easeOut' },
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */
function ProfilePanel({ user }) {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      role: user.role || ROLES[0],
      branch: user.branch || '',
    },
  })

  const onSubmit = async (values) => {
    await new Promise((r) => setTimeout(r, 700))
    reset(values)
    toast.success('Your profile has been updated.', { title: 'Profile saved' })
  }

  const roleOptions = [
    ...new Set([user.role, ...ROLES].filter(Boolean)),
  ].map((r) => ({ value: r, label: r }))

  const branchOptions = [
    ...new Set([user.branch, 'Head Office — Dubai', ...REGIONS.map((r) => `${r} Branch`)].filter(Boolean)),
  ].map((b) => ({ value: b, label: b }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card
        title="Profile information"
        subtitle="Update your personal details and how you appear across ACTIZO."
        icon={<FiUser className="h-5 w-5" />}
      >
        <div className="space-y-6">
          {/* Identity strip */}
          <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-center sm:gap-5 dark:bg-slate-800/50">
            <Avatar name={user.name} color={user.avatarColor} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-ink dark:text-slate-100">
                {user.name}
              </p>
              <p className="truncate text-sm text-ink-soft dark:text-slate-400">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="brand" dot>
                  {user.role}
                </Badge>
                <Badge tone="gray">{user.branch}</Badge>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Input
              label="Full name"
              placeholder="Your name"
              leftIcon={<FiUser className="h-4 w-4" />}
              {...register('name')}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@actizo.com"
              leftIcon={<FiMail className="h-4 w-4" />}
              {...register('email')}
            />
            <Select label="Role" options={roleOptions} {...register('role')} />
            <Select label="Branch" options={branchOptions} {...register('branch')} />
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || isSubmitting}
          onClick={() => reset()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} leftIcon={<FiSave className="h-4 w-4" />}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Appearance                                                          */
/* ------------------------------------------------------------------ */
function ThemePreview({ dark }) {
  return (
    <div
      className={cn(
        'pointer-events-none overflow-hidden rounded-2xl border shadow-soft',
        dark ? 'border-slate-700 bg-slate-950' : 'border-line bg-surface-base',
      )}
    >
      {/* top bar */}
      <div
        className={cn(
          'flex items-center gap-1.5 border-b px-3 py-2',
          dark ? 'border-slate-800 bg-slate-900' : 'border-line bg-white',
        )}
      >
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        <span className={cn('h-2 w-2 rounded-full', dark ? 'bg-slate-700' : 'bg-slate-300')} />
        <span className={cn('h-2 w-2 rounded-full', dark ? 'bg-slate-700' : 'bg-slate-300')} />
      </div>
      <div className="flex gap-2 p-3">
        {/* mini sidebar */}
        <div className="hidden w-12 shrink-0 space-y-1.5 sm:block">
          <div className="h-2.5 w-full rounded bg-brand-500/80" />
          <div className={cn('h-2.5 w-9 rounded', dark ? 'bg-slate-800' : 'bg-slate-200')} />
          <div className={cn('h-2.5 w-10 rounded', dark ? 'bg-slate-800' : 'bg-slate-200')} />
        </div>
        {/* content */}
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                'h-9 rounded-lg border',
                dark ? 'border-slate-800 bg-slate-900' : 'border-line bg-white',
              )}
            >
              <div className="mx-2 mt-2 h-2 w-8 rounded bg-brand-500/70" />
            </div>
            <div
              className={cn(
                'h-9 rounded-lg border',
                dark ? 'border-slate-800 bg-slate-900' : 'border-line bg-white',
              )}
            >
              <div className={cn('mx-2 mt-2 h-2 w-6 rounded', dark ? 'bg-slate-700' : 'bg-slate-300')} />
            </div>
          </div>
          <div
            className={cn(
              'h-12 rounded-lg border',
              dark ? 'border-slate-800 bg-slate-900' : 'border-line bg-white',
            )}
          >
            <div className="flex h-full items-end gap-1 p-2">
              <div className="h-3 w-2 rounded-sm bg-brand-400" />
              <div className="h-5 w-2 rounded-sm bg-brand-500" />
              <div className="h-2 w-2 rounded-sm bg-brand-300" />
              <div className="h-6 w-2 rounded-sm bg-brand-600" />
              <div className="h-4 w-2 rounded-sm bg-brand-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeOption({ active, onClick, icon: Icon, title, desc, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group relative w-full rounded-2xl border p-3 text-left transition-all duration-200 ease-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        active
          ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/40 dark:border-brand-500/60 dark:bg-brand-500/10'
          : 'border-line bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
      )}
    >
      <ThemePreview dark={dark} />
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink dark:text-slate-100">
          <Icon className="h-4 w-4 text-brand-500" />
          {title}
        </span>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
            active
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-slate-300 text-transparent dark:border-slate-600',
          )}
        >
          <FiCheck className="h-3 w-3" />
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink-soft dark:text-slate-400">{desc}</p>
    </button>
  )
}

const ACCENTS = [
  { name: 'Teal', cls: 'from-brand-400 to-brand-600', active: true },
  { name: 'Indigo', cls: 'from-indigo-400 to-indigo-600' },
  { name: 'Violet', cls: 'from-violet-400 to-violet-600' },
  { name: 'Emerald', cls: 'from-emerald-400 to-emerald-600' },
  { name: 'Amber', cls: 'from-amber-400 to-amber-600' },
]

function AppearancePanel() {
  const { isDark, set } = useTheme()

  return (
    <div className="space-y-6">
      <Card
        title="Theme"
        subtitle="Choose how ACTIZO looks. Your preference is saved to this device."
        icon={<FiMonitor className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ThemeOption
              active={!isDark}
              onClick={() => set('light')}
              icon={FiSun}
              title="Light"
              desc="Bright surfaces, ideal for daytime."
              dark={false}
            />
            <ThemeOption
              active={isDark}
              onClick={() => set('dark')}
              icon={FiMoon}
              title="Dark"
              desc="Dimmed surfaces, easy on the eyes."
              dark
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3.5 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500 shadow-soft dark:bg-slate-900">
                {isDark ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-slate-100">Dark mode</p>
                <p className="text-xs text-ink-soft dark:text-slate-400">
                  Currently using {isDark ? 'dark' : 'light'} theme.
                </p>
              </div>
            </div>
            <Switch checked={isDark} onChange={(v) => set(v ? 'dark' : 'light')} />
          </div>
        </div>
      </Card>

      <Card
        title="Accent color"
        subtitle="The brand accent used across buttons, charts and highlights."
        icon={<FiSettings className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {ACCENTS.map((a) => (
              <div key={a.name} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-soft transition-transform',
                    a.cls,
                    a.active
                      ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                      : 'opacity-60',
                  )}
                  aria-hidden="true"
                >
                  {a.active && <FiCheck className="h-5 w-5 text-white" />}
                </span>
                <span className="text-xs font-medium text-ink-soft dark:text-slate-400">{a.name}</span>
              </div>
            ))}
          </div>
          <p className="rounded-xl border border-dashed border-line bg-surface-muted/60 px-4 py-3 text-xs text-ink-soft dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            ACTIZO ships with the signature <span className="font-semibold text-brand-600 dark:text-brand-400">Teal</span> accent.
            Additional palettes are coming soon to your workspace.
          </p>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */
const NOTIF_ROWS = [
  {
    key: 'email',
    icon: FiMail,
    title: 'Email notifications',
    desc: 'Receive lead assignments and status updates by email.',
    default: true,
  },
  {
    key: 'push',
    icon: FiSmartphone,
    title: 'Push notifications',
    desc: 'Get real-time alerts on your devices for new activity.',
    default: true,
  },
  {
    key: 'weekly',
    icon: FiFileText,
    title: 'Weekly report',
    desc: 'A Monday summary of pipeline, sales and team performance.',
    default: false,
  },
]

function NotificationsPanel() {
  const toast = useToast()
  const [prefs, setPrefs] = useState(() =>
    NOTIF_ROWS.reduce((acc, r) => ({ ...acc, [r.key]: r.default }), {}),
  )

  const update = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    const row = NOTIF_ROWS.find((r) => r.key === key)
    toast.info(`${row.title} ${value ? 'enabled' : 'disabled'}.`, { duration: 2200 })
  }

  return (
    <Card
      title="Notification preferences"
      subtitle="Decide which updates reach you and where."
      icon={<FiBell className="h-5 w-5" />}
    >
      <div className="divide-y divide-line dark:divide-slate-800">
        {NOTIF_ROWS.map((row) => {
          const Icon = row.icon
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-slate-100">{row.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft dark:text-slate-400">{row.desc}</p>
                </div>
              </div>
              <Switch checked={prefs[row.key]} onChange={(v) => update(row.key, v)} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Security                                                            */
/* ------------------------------------------------------------------ */
function SecurityPanel() {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: { current: '', next: '', confirm: '' },
  })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 700))
    reset({ current: '', next: '', confirm: '' })
    toast.success('Your password has been updated.', { title: 'Password changed' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card
        title="Change password"
        subtitle="Use a strong password you don't reuse elsewhere."
        icon={<FiLock className="h-5 w-5" />}
      >
        <div className="grid max-w-xl grid-cols-1 gap-4">
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            leftIcon={<FiLock className="h-4 w-4" />}
            {...register('current')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              hint="At least 8 characters."
              leftIcon={<FiLock className="h-4 w-4" />}
              {...register('next')}
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<FiLock className="h-4 w-4" />}
              {...register('confirm')}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Two-factor authentication"
        subtitle="Add an extra layer of security to your account."
        icon={<FiShield className="h-5 w-5" />}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <FiShield className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink dark:text-slate-100">
                Authenticator app
              </p>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-slate-400">
                Not configured yet. Recommended for admins.
              </p>
            </div>
          </div>
          <Badge tone="amber" dot>
            Disabled
          </Badge>
        </div>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || isSubmitting}
          onClick={() => reset({ current: '', next: '', confirm: '' })}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} leftIcon={<FiSave className="h-4 w-4" />}>
          Update password
        </Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Settings() {
  const reduxUser = useSelector(selectUser)
  const user = reduxUser || DEMO_USER
  const [active, setActive] = useState('profile')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, appearance, notifications and security."
        icon={FiSettings}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Section nav */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-20 lg:self-start">
          <Card padding="sm">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-thin lg:flex-col lg:overflow-visible">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = section.key === active
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActive(section.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                      'lg:w-full',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'text-ink-soft hover:bg-surface-muted hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="settings-nav-active"
                        className="absolute inset-y-1.5 left-0 hidden w-1 rounded-full bg-brand-500 lg:block"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-brand-500 text-white shadow-soft'
                          : 'bg-surface-muted text-ink-soft group-hover:text-ink dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{section.label}</span>
                      <span className="hidden truncate text-xs font-normal text-ink-faint dark:text-slate-500 sm:block">
                        {section.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        </nav>

        {/* Panels */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={active} {...panelMotion}>
              {active === 'profile' && <ProfilePanel user={user} />}
              {active === 'appearance' && <AppearancePanel />}
              {active === 'notifications' && <NotificationsPanel />}
              {active === 'security' && <SecurityPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
