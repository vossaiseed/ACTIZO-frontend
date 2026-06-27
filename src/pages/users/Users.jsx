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
  FiEyeOff,
  FiUserPlus,
  FiEdit3,
  FiPower,
  FiKey,
  FiTrash2,
  FiX,
  FiSave,
} from 'react-icons/fi'

import {
  selectStaff,
  fetchStaff,
  addStaff,
  updateStaff,
  toggleStaffStatus,
  resetStaffPin,
} from '@/redux/slices/staffSlice'
import {
  fetchUsers,
  addUser,
  updateUser,
  removeUser,
  resetUserPin,
  selectExtraUsers,
  selectUserStatus,
} from '@/redux/slices/userSlice'
import { fetchBranches, selectBranchOptions } from '@/redux/slices/branchSlice'
import { selectUser, selectRoleKey } from '@/redux/slices/authSlice'
import { formatDate } from '@/utils/format'
import { searchData, sortData, paginate, unique } from '@/utils/helpers'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import KPICard from '@/components/cards/KPICard'
import EmptyState from '@/components/feedback/EmptyState'
import Modal from '@/components/overlay/Modal'
import ConfirmDialog from '@/components/overlay/ConfirmDialog'
import { useToast } from '@/hooks/useToast'

const ALL = { value: 'All', label: 'All' }
const PAGE_SIZE = 9
const SEARCH_KEYS = ['name', 'email', 'role', 'branchName']

// Display label for a backend system role.
const ROLE_LABEL = {
  admin: 'Administrator',
  branch_manager: 'Branch Manager',
}
// Map a backend system role to the page's `kind` bucket.
const ROLE_KIND = {
  admin: 'admin',
  branch_manager: 'manager',
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

export default function Users() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const staff = useSelector(selectStaff)
  const extraUsers = useSelector(selectExtraUsers)
  const userStatus = useSelector(selectUserStatus)
  const branchOptions = useSelector(selectBranchOptions)
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
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loading = userStatus === 'loading' || userStatus === 'idle'

  // Load system users (admins + branch managers), sales staff and branch
  // reference data (real UUIDs for the form's Branch select) on mount.
  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchStaff())
    dispatch(fetchBranches())
  }, [dispatch])

  // id -> branch name, sourced from the live branch list.
  const branchNameById = useMemo(() => {
    const map = {}
    for (const o of branchOptions) map[o.value] = o.label
    return map
  }, [branchOptions])

  // System users = Admins + Branch Managers (from /users) + Sales Staff (from /staff).
  const users = useMemo(() => {
    const systemUsers = extraUsers.map((u) => ({
      ...u,
      role: ROLE_LABEL[u.role] || u.role,
      kind: ROLE_KIND[u.role] || 'manager',
      branchName: u.branchName || branchNameById[u.branchId] || (u.role === 'admin' ? 'Head Office' : ''),
      lastActive: u.lastLoginAt || u.lastActive || u.updatedAt || u.createdAt,
      // Admins are not editable from this screen; branch managers are.
      editable: canManage && u.role === 'branch_manager',
    }))
    const staffUsers = staff.map((s) => ({
      id: s.id, name: s.name, email: s.email, role: s.role, pin: s.pin,
      branchId: s.branchId, branchName: s.branchName || branchNameById[s.branchId] || '',
      avatarColor: s.avatarColor, status: s.status || 'active',
      lastActive: s.lastLoginAt || s.updatedAt || s.createdAt, kind: 'staff', editable: true,
    }))
    return [...systemUsers, ...staffUsers]
  }, [staff, extraUsers, branchNameById, canManage])

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
    const nextStatus = row.status === 'active' ? 'inactive' : 'active'
    if (row.kind === 'staff') dispatch(toggleStaffStatus(row.id))
    else dispatch(updateUser({ id: row.id, status: nextStatus }))
    toast.success(`${row.name} is now ${nextStatus === 'active' ? 'Active' : 'Inactive'}.`)
  }
  const handleResetPin = (row) => {
    const action = row.kind === 'staff' ? resetStaffPin(row.id) : resetUserPin(row.id)
    dispatch(action)
      .unwrap()
      .then(({ pin }) => toast.success(`New PIN for ${row.name}: ${pin}`, { title: 'PIN reset' }))
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not reset PIN.'))
  }
  const handleDelete = (row) => {
    dispatch(removeUser(row.id))
      .unwrap()
      .then(() => toast.success(`${row.name} removed.`, { title: 'User deleted' }))
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not delete user.'))
    setDeleteTarget(null)
  }

  const handleSubmit = (form, member) => {
    // Branch managers are locked to their own branch when creating.
    const branchId = isBranchManager ? authUser?.branchId || form.branchId : form.branchId
    const branchName = branchNameById[branchId] || ''
    if (member) {
      // edit
      if (member.kind === 'staff') {
        dispatch(updateStaff({
          id: member.id, name: form.name.trim(), phone: form.mobile.trim(),
          email: form.email.trim(), branchId, branchName, status: form.status,
        }))
          .unwrap()
          .then(() => toast.success(`${form.name} updated.`, { title: 'User updated' }))
          .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not update user.'))
      } else {
        dispatch(updateUser({
          id: member.id, name: form.name.trim(), email: form.email.trim(),
          phone: form.mobile.trim(), branchId, status: form.status, role: 'branch_manager',
        }))
          .unwrap()
          .then(() => toast.success(`${form.name} updated.`, { title: 'User updated' }))
          .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not update user.'))
      }
    } else if (form.role === 'branch_manager' && isAdmin) {
      // Only an Admin may create Branch Manager accounts.
      dispatch(addUser({
        name: form.name.trim(), email: form.email.trim(), phone: form.mobile.trim(),
        role: 'branch_manager', branchId, pin: form.pin,
      }))
        .unwrap()
        .then((user) => {
          const pin = user?.pin
          toast.success(
            pin ? `Branch Manager "${form.name}" created — PIN ${pin}` : `Branch Manager "${form.name}" created.`,
            { title: 'User created' },
          )
        })
        .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not create user.'))
    } else {
      dispatch(addStaff({
        name: form.name.trim(), role: 'Sales Executive', branchId, branchName,
        email: form.email.trim(), phone: form.mobile.trim(), avatarColor: pickColor(),
        status: form.status, pin: form.pin,
      }))
        .unwrap()
        .then((user) => {
          const pin = user?.pin
          toast.success(
            pin ? `Sales Staff "${form.name}" created — PIN ${pin}` : `Sales Staff "${form.name}" created.`,
            { title: 'User created' },
          )
        })
        .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not create user.'))
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

      {loading && paged.length === 0 ? (
        <div className="card">
          <EmptyState icon={FiUsers} title="Loading users…" description="Fetching system users from the server." className="py-16" />
        </div>
      ) : paged.length === 0 ? (
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
              onDelete={(x) => setDeleteTarget(x)}
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
        branchOptions={branchOptions}
        lockBranch={isBranchManager}
        defaultBranchId={isBranchManager ? authUser?.branchId : undefined}
        canCreateManager={isAdmin}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete user?"
        description={`This permanently removes ${deleteTarget?.name || 'this user'} from the system. This action cannot be undone.`}
        confirmLabel="Delete User"
        tone="danger"
      />
    </motion.div>
  )
}

/* ---------------- User card ---------------- */
function UserCard({ user, canManage, onEdit, onToggle, onResetPin, onDelete, onView }) {
  const active = user.status === 'active'
  const manageable = canManage && user.editable
  const [showPin, setShowPin] = useState(false)
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
        <span className="text-ink dark:text-slate-200">
          {user.lastActive ? formatDate(user.lastActive, 'dd MMM yyyy, hh:mm aaa') : '—'}
        </span>
      </p>

      {user.pin && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-muted/60 px-3 py-2 text-xs font-medium text-ink-soft dark:bg-slate-800/50 dark:text-slate-400">
          <FiKey className="h-3.5 w-3.5 shrink-0" />
          <span>Login PIN</span>
          <span className="font-mono text-sm font-bold tracking-[0.3em] text-ink dark:text-slate-100">
            {showPin ? user.pin : '••••••'}
          </span>
          <button
            type="button"
            onClick={() => setShowPin((s) => !s)}
            aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            aria-pressed={showPin}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800"
          >
            {showPin ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
            {showPin ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {manageable ? (
        <div className="mt-auto space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" leftIcon={<FiKey />} onClick={() => onResetPin(user)}>
              Reset PIN
            </Button>
            <Button variant="outline" size="sm" leftIcon={<FiPower />} onClick={() => onToggle(user)}>
              {active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
          {user.kind !== 'staff' && (
            <Button variant="ghost" size="sm" fullWidth leftIcon={<FiTrash2 />} onClick={() => onDelete(user)}>
              Delete
            </Button>
          )}
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

const randomPin = () => String(Math.floor(100000 + Math.random() * 900000))

function UserFormModal({ open, onClose, onSubmit, member, branchOptions = [], lockBranch, defaultBranchId, canCreateManager = false }) {
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
      role: 'staff', name: '', mobile: '', email: '',
      branchId: defaultBranchId || branchOptions[0]?.value || '',
      status: 'active', pin: '',
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
            branchId: member.branchId || defaultBranchId || branchOptions[0]?.value || '',
            status: member.status || 'active',
            pin: '',
          }
        : {
            role: 'staff', name: '', mobile: '', email: '',
            branchId: defaultBranchId || branchOptions[0]?.value || '',
            status: 'active', pin: randomPin(),
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
            ? 'Create a new Sales Staff or Branch Manager. They sign in with the 6-digit PIN you set below.'
            : 'Create a new Sales Staff member. They sign in with the 6-digit PIN you set below.'
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
        <Select label={roleVal === 'branch_manager' ? 'Branch' : 'Assigned Branch'} options={branchOptions} disabled={lockBranch} hint={lockBranch ? 'Locked to your branch' : undefined} {...register('branchId', { required: true })} />
        {!isEdit && (
          <Input
            label="6-Digit Login PIN"
            maxLength={6}
            inputMode="numeric"
            hint="The user signs in with this PIN"
            error={errors.pin?.message}
            {...register('pin', { required: 'PIN is required', pattern: { value: /^\d{6}$/, message: 'PIN must be exactly 6 digits' } })}
          />
        )}
      </form>
    </Modal>
  )
}
