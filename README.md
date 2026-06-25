# ACTIZO CRM

A premium, enterprise-grade **CRM frontend** built with React. ACTIZO CRM delivers a SaaS-level experience comparable to HubSpot, Salesforce Lightning, Zoho CRM, Stripe Dashboard, Linear and Vercel — covering leads, follow-ups, sales, targets, incentives, branches, staff, reports and finance.

> Frontend-only. All data is realistic **mock data** — no backend required.

---

## ✨ Highlights

- **Brand theme** — White / `#F8FAFC` surfaces with a teal accent `#36BAB3` used for buttons, active nav, icons, charts, progress bars, KPIs and focus states.
- **Dark & light mode** across every surface (persisted).
- **Premium UI** — glassmorphism, soft shadows, rounded-2xl cards, gradient accents, smooth framer-motion micro-interactions, loading skeletons, toast notifications and beautiful empty states.
- **Fully responsive**, mobile-first, with a collapsible sidebar, sticky header, mobile nav drawer, global search (⌘K), notification center, profile dropdown and theme toggle.
- **Rich analytics** — Recharts area/line/bar/pie/radial charts everywhere.
- **Production-ready architecture** — Redux Toolkit + Redux Persist, React Router, reusable component library, custom hooks, utils and a typed-shape mock data layer.

## 🧱 Tech Stack

React 18 · Vite · Tailwind CSS · Redux Toolkit · Redux Persist · React Router DOM · Axios · Framer Motion · React Icons · Recharts · React Hook Form · date-fns · clsx

## 🚀 Getting Started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build
```

**Login:** the auth flow is in demo mode — **any email/password works**.

## 📁 Project Structure

```
src/
├── assets/              # static assets
├── components/
│   ├── ui/              # Button, Card, Input, Select, Badge, StatusBadge,
│   │                    # Avatar, Tabs, Pagination, ProgressBar, Tooltip, Switch, Dropdown
│   ├── feedback/        # Toast, Loader, PageLoader, Skeleton, EmptyState
│   ├── overlay/         # Modal, Drawer, ConfirmDialog
│   ├── common/          # Breadcrumb, SearchBar, PageHeader
│   ├── data/            # DataTable (advanced sortable/searchable table)
│   ├── cards/           # KPICard, ChartCard, ProfileCard
│   ├── charts/          # themed Recharts wrappers (Area/Line/Bar/Pie/Radial views)
│   ├── timeline/        # Timeline
│   └── layout/          # Sidebar, MobileSidebar, Header, NotificationCenter,
│                        # ProfileDropdown, ThemeToggle, GlobalSearch
├── layouts/             # MainLayout, AuthLayout
├── pages/
│   ├── auth/            # Login, ForgotPassword, ResetPassword
│   ├── dashboard/       # Dashboard
│   ├── leads/           # LeadList, LeadDetails
│   ├── followup/        # FollowUp
│   ├── sales/           # Sales
│   ├── targets/         # Targets (General / Special / Project)
│   ├── incentives/      # Incentives
│   ├── branches/        # BranchList, BranchDetails
│   ├── staff/           # StaffList, StaffProfile
│   ├── reports/         # Reports & Analytics
│   ├── finance/         # Finance Dashboard
│   ├── settings/        # Settings
│   └── NotFound.jsx
├── redux/
│   ├── store.js         # configureStore + redux-persist (persists auth & ui)
│   └── slices/          # ui, auth, dashboard, lead, sales, target,
│                        # incentive, branch, staff, finance
├── routes/              # AppRoutes, ProtectedRoute
├── services/            # api (axios instance), mockApi
├── hooks/               # useTheme, useDebounce, useMediaQuery, useToast
├── utils/               # cn, format, helpers, export (CSV/Excel/PDF)
├── constants/           # app constants, status styles, navigation
├── data/                # realistic mock data (branches, staff, leads, sales, …)
├── App.jsx
└── main.jsx
```

## 🧩 Modules

| Module | What's inside |
| --- | --- |
| **Dashboard** | 11 KPI cards, revenue/pipeline/sales/branch/staff/conversion charts, recent activities, recent leads, top performers, upcoming follow-ups |
| **Leads** | Searchable/filterable/sortable/paginated table, add-lead form, lead details with status tracker, timeline, follow-up history, activity logs, notes |
| **Follow-Ups** | Modern timeline feed, add/edit follow-ups, next-follow-up tracking, remarks |
| **Sales** | KPIs, revenue & product & branch charts, recent sales table, top products & staff |
| **Targets** | General · Special (campaign) · Project targets with tabs, progress bars, achievement charts and per-type tables |
| **Incentives** | KPIs, top performer, incentive trend & by-branch charts, incentive list & history |
| **Branches** | Branch cards & details — staff count, leads, sales, revenue, target achievement |
| **Staff** | Staff cards & profiles — performance metrics, assigned leads, revenue, incentives, target achievement |
| **Reports** | Lead/Sales/Revenue/Branch/Staff/Target/Incentive reports with line/bar/pie/area charts + PDF/Excel/CSV export |
| **Finance** | Revenue, expenses, P&L, receivables, incentives paid, financial health score, revenue-vs-expense / profit / cash-flow charts |

## 🎨 Design Tokens

| Token | Value |
| --- | --- |
| Primary accent | `#36BAB3` (Tailwind `brand-500`) |
| App background | `#F8FAFC` |
| Card background | `#FFFFFF` |
| Primary text | `#1F2937` |
| Secondary text | `#6B7280` |
| Border | `#E5E7EB` |

---

Built as a frontend showcase. Connect a real API by setting `VITE_API_URL` and swapping the mock data layer.
