import { createSlice } from '@reduxjs/toolkit'
import { leads as seedLeads } from '../../data/leads'
import { staffById } from '../../data/staff'

const defaultFilters = {
  search: '',
  status: 'All',
  branch: 'All',
  staff: 'All',
  source: 'All',
  priority: 'All',
}

const initialState = {
  items: seedLeads,
  filters: defaultFilters,
  sort: { key: 'createdDate', dir: 'desc' },
  page: 1,
  pageSize: 8,
  status: 'idle',
}

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
      state.page = 1
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters }
      state.page = 1
    },
    setSort: (state, action) => {
      const key = action.payload
      if (state.sort.key === key) {
        state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc'
      } else {
        state.sort = { key, dir: 'asc' }
      }
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 1
    },
    addLead: (state, action) => {
      state.items.unshift(action.payload)
    },
    updateLead: (state, action) => {
      const idx = state.items.findIndex((l) => l.id === action.payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload }
    },
    deleteLead: (state, action) => {
      state.items = state.items.filter((l) => l.id !== action.payload)
    },
    assignStaff: (state, action) => {
      const { leadId, staffId } = action.payload
      const lead = state.items.find((l) => l.id === leadId)
      if (!lead) return
      const member = staffById(staffId)
      lead.staffId = staffId
      lead.staffName = member?.name || 'Unassigned'
      if (lead.status === 'New Lead') lead.status = 'Assigned'
      const date = new Date().toISOString().slice(0, 10)
      lead.timeline.push({
        id: `t-${Date.now()}`,
        type: 'assigned',
        title: 'Staff assigned',
        description: `Lead allocated to ${member?.name || 'staff'}`,
        date,
        by: 'Branch Manager',
      })
      lead.activities.unshift({
        id: `a-${Date.now()}`,
        action: 'Staff assigned',
        detail: `Allocated to ${member?.name || 'staff'}`,
        date,
        by: 'Branch Manager',
      })
      lead.lastActivity = date
    },
    updateLeadStatus: (state, action) => {
      const { id, status } = action.payload
      const lead = state.items.find((l) => l.id === id)
      if (lead) {
        lead.status = status
        lead.timeline.push({
          id: `t-${Date.now()}`,
          type: 'status',
          title: status,
          description: `Stage moved to ${status}`,
          date: new Date().toISOString().slice(0, 10),
          by: lead.staffName,
        })
      }
    },
    addFollowUp: (state, action) => {
      const { leadId, followUp } = action.payload
      const lead = state.items.find((l) => l.id === leadId)
      if (lead) {
        lead.followUps.unshift(followUp)
        lead.activities.unshift({
          id: `a-${Date.now()}`,
          action: `Follow-up (${followUp.type})`,
          detail: followUp.remark,
          date: followUp.date,
          by: followUp.by,
        })
        lead.lastActivity = followUp.date
        if (followUp.nextDate) lead.nextFollowUp = followUp.nextDate
      }
    },
    deleteFollowUp: (state, action) => {
      const { leadId, followUpId } = action.payload
      const lead = state.items.find((l) => l.id === leadId)
      if (lead) lead.followUps = lead.followUps.filter((f) => f.id !== followUpId)
    },
  },
})

export const {
  setFilter,
  resetFilters,
  setSort,
  setPage,
  setPageSize,
  addLead,
  updateLead,
  deleteLead,
  assignStaff,
  updateLeadStatus,
  addFollowUp,
  deleteFollowUp,
} = leadSlice.actions

export const selectLeads = (s) => s.leads.items
export const selectLeadFilters = (s) => s.leads.filters
export const selectLeadById = (id) => (s) => s.leads.items.find((l) => l.id === id)

export default leadSlice.reducer
