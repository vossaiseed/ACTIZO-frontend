import { hoursOffset } from './_helpers'

export const notifications = [
  { id: 'NT-01', type: 'lead', title: 'New high-value lead', message: 'Priya Sharma (AED 240,000) assigned to Dubai — Downtown.', time: hoursOffset(-1), read: false },
  { id: 'NT-02', type: 'target', title: 'Target milestone reached', message: 'ACP Panel monthly target is now 92% complete.', time: hoursOffset(-3), read: false },
  { id: 'NT-03', type: 'won', title: 'Deal won 🎉', message: 'Carlos Garcia closed at AED 186,500 — Marina branch.', time: hoursOffset(-6), read: false },
  { id: 'NT-04', type: 'followup', title: 'Follow-up due today', message: '5 follow-ups are scheduled for today across branches.', time: hoursOffset(-9), read: true },
  { id: 'NT-05', type: 'incentive', title: 'Incentives processed', message: 'May 2026 incentives have been disbursed to 28 staff.', time: hoursOffset(-26), read: true },
  { id: 'NT-06', type: 'finance', title: 'Receivables alert', message: 'AED 94,000 in receivables crossed 90 days.', time: hoursOffset(-30), read: true },
  { id: 'NT-07', type: 'campaign', title: 'Campaign ending soon', message: 'Weekend Flash Sale ends in 2 days — 64% achieved.', time: hoursOffset(-48), read: true },
]

export const unreadCount = notifications.filter((n) => !n.read).length

export default notifications
