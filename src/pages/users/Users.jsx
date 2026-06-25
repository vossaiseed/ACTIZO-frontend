import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  FiUsers,
  FiShield,
  FiHome,
  FiUserCheck,
  FiEye,
  FiMoreVertical,
  FiUserPlus,
  FiEdit3,
  FiPower,
  FiKey,
  FiX,
  FiSave,
} from 'react-icons/fi'

import { selectStaff, addStaff, updateStaff, toggleStaffStatus } from '@/redux/slices/staffSlice'
import { addUser, updateUser, selectExtraUsers } from '@/redux/slices/userSlice'
import { selectUser, selectRoleKey } from '@/redux/slices/authSlice'
import { branches, branchById, branchOptions } from '@/data/branches'
import { formatDate } from '@/utils/format'
import { searchData, sortData, paginate, unique } from '@/utils/helpers'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Pagination from '@/components/ui/Pagination'
import KPICard from '@/components/cards/KPICard'
import EmptyState from '@/components/feedback/EmptyState'
import Modal from '@/components/overlay/Modal'
import { useToast } from '@/hooks/useToast'

const ALL = { value: 'All', label: 'All' }
const PAGE_SIZE = 9
const SEARCH_KEYS = ['name', 'email', 'role', 'branchName']

const ROLE_TONE = {
  Administrator: 'brand',
  'Branch Manager': 'sky',
  'Team Lead': 'violet',
  'Senior Sales Executive': 'amber',
  'Sales Executive': 'gray',
}

const AVATAR_COLORS = [
  'from-brand-400 to-brand-600',
  'from-indigo-400 to-indigo-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
]
const pickColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
const randomPin = () => String(Math.floor(100000 + Math.random() * 900000))
const todayISO = () => new Date().toISOString().slice(0, 10)
const lastActiveAt = (i) => new Date(Date.now() - (i * 5 + 1) * 3600 * 1000).toISOString()

export default function Users() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const staff = useSelector(selectStaff)
  const extraUsers = useSelector(selectExtraUsers)
  const authUser = useSelector(selectUser)
  const roleKey = useSelector(selectRoleKey)
  const isBranchManager = roleKey === 'branch_manager'
  const isAdmin = roleKey === 'admin'
  const canManage = isAdmin || isBranchManager

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // System users = Admin + Branch Managers (seed + created) + Sales Staff.
  const users = useMemo(() => {
    const admin = {
      id: 'USR-ADMIN', name: 'Alex Morgan', email: 'admin@actizo.com',
      role: 'Administrator', branchName: 'Head Office',
      avatarColor: 'from-brand-400 to-brand-600', status: 'active',
      lastActive: lastActiveAt(0), kind: 'admin', editable: false,
    }
    const managers = branches.map((b, i) => ({
      id: `USR-BM-${b.id}`, name: b.manager, email: b.email,
      role: 'Branch Manager', branchName: b.name,
      avatarColor: ['from-indigo-400 to-indigo-600', 'from-sky-400 to-sky-600'][i % 2],
      status: 'active', lastActive: lastActiveAt(i + 1), kind: 'manager', editable: false,
    }))
    const created = extraUsers.map((u) => ({ ...u, kind: u.kind || 'manager', editable: true }))
    const staffUsers = staff.map((s, i) => ({
      id: s.id, name: s.name, email: s.email, role: s.role, branchName: s.branchName,
      avatarColor: s.avatarColor, status: s.status || 'active',
      lastActive: lastActiveAt(i + branches.length + 1), kind: 'staff', editable: true,
    }))
    return [admin, ...managers, ...created, ...staffUsers]
  }, [staff, extraUsers])

  const roleOptions = useMemo(() => [ALL, ...unique(users.map((u) => u.role)).map((r) => ({ value: r, label: r }))], [users])
  const statusOptions = [ALL, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.kind === 'admin').length,
      managers: users.filter((u) => u.kind === 'manager').length,
      staff: users.filter((u) => u.kind === 'staff').length,
    }),
    [users],
  )

  const filtered = useMemo(() => {
    let rows = searchData(users, search, SEARCH_KEYS)
    if (role !== 'All') rows = rows.filter((u) => u.role === role)
    if (status !== 'All') rows = rows.filter((u) => u.status === status)
    return sortData(rows, sort.key, sort.dir)
  }, [users, search, role, status, sort])

  const paged = paginate(filtered, page, PAGE_SIZE)
  const onSort = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
    setPage(1)
  }

  /* ---- CRUD handlers ---- */
  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (row) => {
    const full = row.kind === 'staff' ? staff.find((s) => s.id === row.id) : extraUsers.find((u) => u.id === row.id)
    setEditing({ ...(full || row), kind: row.kind })
    setFormOpen(true)
  }
  const handleToggle = (row) => {
    if (row.kind === 'staff') dispatch(toggleStaffStatus(row.id))
    else dispatch(updateUser({ id: row.id, status: row.status === 'active' ? 'inactive' : 'active' }))
    toast.success(`${row.name} is now ${row.status === 'active' ? 'Inactive' : 'Active'}.`)
  }
  const handleResetPin = (row) => {
    const pin = randomPin()
    if (row.kind === 'staff') dispatch(updateStaff({ id: row.id, pin }))
    else dispatch(updateUser({ id: row.id, pin }))
    toast.success(`New PIN for ${row.name}: ${pin}`, { title: 'PIN reset' })
  }

  const handleSubmit = (form, member) => {
    const branchId = isBranchManager ? authUser?.branchId || form.branchId : form.branchId
    const branchName = branchById(branchId)?.name || ''
    if (member) {
      // edit
      if (member.kind === 'staff') {
        dispatch(updateStaff({
          id: member.id, name: form.name.trim(), phone: form.mobile.trim(),
          email: form.email.trim(), employeeId: form.employeeId.trim(),
          branchId, branchName, status: form.status, pin: form.pin,
        }))
      } else {
        dispatch(updateUser({
          id: member.id, name: form.name.trim(), email: form.email.trim(),
          phone: form.mobile.trim(), employeeId: form.employeeId.trim(),
          branchId, branchName, status: form.status, pin: form.pin, role: 'Branch Manager',
        }))
      }
      toast.success(`${form.name} updated.`, { title: 'User updated' })
    } else if (form.role === 'branch_manager' && isAdmin) {
      // Only an Admin may create Branch Manager accounts.
      dispatch(addUser({
        id: `USR-BM-${Date.now()}`, name: form.name.trim(), email: form.email.trim(),
        phone: form.mobile.trim(), employeeId: form.employeeId.trim(),
        role: 'Branch Manager', branchId, branchName, avatarColor: pickColor(),
        status: form.status, pin: form.pin, lastActive: new Date().toISOString(), kind: 'manager',
      }))
      toast.success(`Branch Manager "${form.name}" created — PIN ${form.pin}`, { title: 'User created' })
    } else {
      dispatch(addStaff({
        id: `STF-${Date.now()}`, name: form.name.trim(), firstName: form.name.trim().split(' ')[0],
        role: 'Sales Executive', branchId, branchName, email: form.email.trim(),
        phone: form.mobile.trim(), employeeId: form.employeeId.trim(), pin: form.pin,
        avatarColor: pickColor(), joinDate: todayISO(), status: form.status,
        assignedLeads: 0, wonLeads: 0, conversionRate: 0, revenue: 0, target: 0,
        achievement: 0, incentiveEarned: 0, performanceScore: 50, rating: 0,
      }))
      toast.success(`Sales Staff "${form.name}" created — PIN ${form.pin}`, { title: 'User created' })
    }
    setFormOpen(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Create & manage all system users — branch managers and sales staff"
        icon={FiUsers}
        actions={canManage ? <Button leftIcon={<FiUserPlus />} onClick={openCreate}>Add User</Button> : null}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Users" value={stats.total} icon={FiUsers} tone="brand" />
        <KPICard label="Admins" value={stats.admins} icon={FiShield} tone="violet" />
        <KPICard label="Branch Managers" value={stats.managers} icon={FiHome} tone="sky" />
        <KPICard label="Sales Staff" value={stats.staff} icon={FiUserCheck} tone="emerald" />
      </div>

      <div className="card space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-6">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name, email, role…" />
          </div>
          <Select options={roleOptions} value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} aria-label="Filter by role" containerClassName="lg:col-span-3" />
          <Select options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Filter by status" containerClassName="lg:col-span-3" />
        </div>
        <div className="border-t border-line pt-3 text-xs text-ink-soft dark:border-slate-800 dark:text-slate-400">
          <span className="font-semibold text-ink dark:text-slate-200">{filtered.length}</span> users
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="card">
          <EmptyState icon={FiUsers} title="No users found" description="Try adjusting your search or filters." className="py-16" />
        </div>
      ) : (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {paged.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              canManage={canManage}
              onEdit={openEdit}
              onToggle={handleToggle}
              onResetPin={handleResetPin}
              onView={(x) => navigate(`/staff/${x.id}`)}
            />
          ))}
        </motion.div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        member={editing}
        lockBranch={isBranchManager}
        defaultBranchId={isBranchManager ? authUser?.branchId : undefined}
        canCreateManager={isAdmin}
      />
    </motion.div>
  )
}

/* ---------------- User card ---------------- */
function UserCard({ user, canManage, onEdit, onToggle, onResetPin, onView }) {
  const active = user.status === 'active'
  const manageable = canManage && user.editable
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="card card-hover flex flex-col gap-4 p-5"
    >
      <div className="flex items-start gap-3">
        <Avatar name={user.name} color={user.avatarColor} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-ink dark:text-slate-100">{user.name}</h3>
          <p className="truncate text-sm text-ink-soft dark:text-slate-400">{user.role}</p>
        </div>
        {manageable && (
          <button
            type="button"
            onClick={() => onEdit(user)}
            aria-label="Edit user"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-surface-muted hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gray">{user.kind}</Badge>
        <Badge tone={active ? 'green' : 'gray'} dot>{active ? 'Active' : 'Inactive'}</Badge>
        <Badge tone="gray">
          <FiHome className="h-3 w-3" />
          {user.branchName}
        </Badge>
      </div>

      <p className="text-xs font-medium text-ink-soft dark:text-slate-400">
        Last login:{' '}
        <span className="text-ink dark:text-slate-200">{formatDate(user.lastActive, 'dd MMM yyyy, hh:mm aaa')}</span>
      </p>

      {manageable ? (
        <div className="mt-auto grid grid-cols-2 gap-3 pt-1">
          <Button variant="outline" size="sm" leftIcon={<FiKey />} onClick={() => onResetPin(user)}>
            Reset PIN
          </Button>
          <Button variant="outline" size="sm" leftIcon={<FiPower />} onClick={() => onToggle(user)}>
            {active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ) : user.kind === 'staff' ? (
        <div className="mt-auto pt-1">
          <Button variant="outline" size="sm" fullWidth rightIcon={<FiEye />} onClick={() => onView(user)}>
            View Profile
          </Button>
        </div>
      ) : null}
    </motion.div>
  )
}

/* ---------------- Create / Edit user modal (Staff or Branch Manager) ------ */
const ROLE_OPTS = [
  { value: 'staff', label: 'Sales Staff' },
  { value: 'branch_manager', label: 'Branch Manager' },
]
const STATUS_OPTS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function UserFormModal({ open, onClose, onSubmit, member, lockBranch, defaultBranchId, canCreateManager = false }) {
  const isEdit = Boolean(member)
  // Branch Managers may only create Staff — hide the Branch Manager option.
  const roleOptions = canCreateManager ? ROLE_OPTS : ROLE_OPTS.filter((r) => r.value === 'staff')
  const roleLocked = isEdit || !canCreateManager
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'staff', name: '', mobile: '', email: '', employeeId: '',
      branchId: defaultBranchId || branchOptions[0]?.value || '',
      pin: '', status: 'active',
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      member
        ? {
            role: member.kind === 'manager' ? 'branch_manager' : 'staff',
            name: member.name || '',
            mobile: member.phone || '',
            email: member.email || '',
            employeeId: member.employeeId || member.id || '',
            branchId: member.branchId || defaultBranchId || branchOptions[0]?.value || '',
            pin: member.pin || '',
            status: member.status || 'active',
          }
        : {
            role: 'staff', name: '', mobile: '', email: '', employeeId: '',
            branchId: defaultBranchId || branchOptions[0]?.value || '',
            pin: randomPin(), status: 'active',
          },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member])

  const roleVal = watch('role')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      description={
        isEdit
          ? 'Update this user’s details.'
          : canCreateManager
            ? 'Create a new Sales Staff or Branch Manager. They sign in with the generated 6-digit PIN.'
            : 'Create a new Sales Staff member. They sign in with the generated 6-digit PIN.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="user-form" leftIcon={<FiSave />}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit((form) => onSubmit(form, member))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="User Role"
          options={roleOptions}
          disabled={roleLocked}
          hint={isEdit ? 'Role cannot be changed' : !canCreateManager ? 'Branch Managers can add Staff only' : undefined}
          {...register('role', { required: true })}
        />
        <Select label="Status" options={STATUS_OPTS} {...register('status', { required: true })} />
        <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Full name is required' })} />
        <Input label="Mobile Number" type="tel" placeholder="+91 9XXXX XXXXX" error={errors.mobile?.message} {...register('mobile', { required: 'Mobile number is required' })} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
        <Input label="Employee ID" placeholder="e.g. EMP-1024" error={errors.employeeId?.message} {...register('employeeId', { required: 'Employee ID is required' })} />
        <Select label={roleVal === 'branch_manager' ? 'Branch' : 'Assigned Branch'} options={branchOptions} disabled={lockBranch} hint={lockBranch ? 'Locked to your branch' : undefined} {...register('branchId', { required: true })} />
        <Input label="6-Digit PIN" maxLength={6} inputMode="numeric" error={errors.pin?.message} {...register('pin', { required: 'PIN is required', pattern: { value: /^\d{6}$/, message: 'PIN must be exactly 6 digits' } })} />
      </form>
    </Modal>
  )
}
