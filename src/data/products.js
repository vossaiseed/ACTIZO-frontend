import { dateOffset } from './_helpers'

// ACTIZO product catalogue — organised across six categories.
export const PRODUCT_CATEGORIES = [
  'ACP Sheets',
  'Construction Materials',
  'Industrial Products',
  'Manufacturing Products',
  'Project Supply Materials',
  'Distribution Products',
]

export const PRODUCT_STATUSES = ['Active', 'Inactive']

export const products = [
  // ── ACP Sheets ──
  { id: 'PRD-01', name: 'ACP Sheet — Silver Metallic', code: 'ACP-001', brand: 'Alstrong', category: 'ACP Sheets', unit: 'SQM', price: 320, sold: 4820, growth: 18.6, status: 'Active', createdDate: dateOffset(-420), description: 'Premium silver metallic aluminium composite panel for exterior cladding.' },
  { id: 'PRD-02', name: 'ACP Sheet — Wooden Finish', code: 'ACP-002', brand: 'Aludecor', category: 'ACP Sheets', unit: 'SQM', price: 360, sold: 3120, growth: 14.2, status: 'Active', createdDate: dateOffset(-380), description: 'Natural wooden-finish ACP panel for facades and interiors.' },
  { id: 'PRD-03', name: 'Fire-Rated ACP Sheet', code: 'ACP-003', brand: 'Eurobond', category: 'ACP Sheets', unit: 'SQM', price: 540, sold: 1860, growth: 22.9, status: 'Active', createdDate: dateOffset(-300), description: 'A2 fire-rated aluminium composite panel for high-rise projects.' },

  // ── Construction Materials ──
  { id: 'PRD-04', name: 'TMT Steel Bar', code: 'CON-001', brand: 'Tata Tiscon', category: 'Construction Materials', unit: 'TON', price: 62000, sold: 280, growth: 6.4, status: 'Active', createdDate: dateOffset(-500), description: 'Fe-550 grade TMT reinforcement steel bars.' },
  { id: 'PRD-05', name: 'Ready-Mix Concrete', code: 'CON-002', brand: 'UltraTech', category: 'Construction Materials', unit: 'CUM', price: 5200, sold: 940, growth: 9.1, status: 'Active', createdDate: dateOffset(-460), description: 'M25 grade ready-mix concrete delivered on-site.' },
  { id: 'PRD-06', name: 'Cement Bag (50kg)', code: 'CON-003', brand: 'ACC', category: 'Construction Materials', unit: 'BAG', price: 410, sold: 8940, growth: 5.7, status: 'Active', createdDate: dateOffset(-520), description: 'OPC 53 grade cement, 50kg bag.' },

  // ── Industrial Products ──
  { id: 'PRD-07', name: 'Aluminium Profile', code: 'IND-001', brand: 'Jindal', category: 'Industrial Products', unit: 'PCS', price: 880, sold: 2120, growth: 11.3, status: 'Active', createdDate: dateOffset(-340), description: 'Architectural aluminium extrusion profile.' },
  { id: 'PRD-08', name: 'Industrial Adhesive', code: 'IND-002', brand: 'Pidilite', category: 'Industrial Products', unit: 'LTR', price: 540, sold: 1640, growth: 8.1, status: 'Inactive', createdDate: dateOffset(-280), description: 'High-bond industrial structural adhesive.' },

  // ── Manufacturing Products ──
  { id: 'PRD-09', name: 'PVC Sheet', code: 'MFG-001', brand: 'Sintex', category: 'Manufacturing Products', unit: 'PCS', price: 145, sold: 6210, growth: 12.4, status: 'Active', createdDate: dateOffset(-410), description: 'Rigid PVC foam board for signage and interiors.' },
  { id: 'PRD-10', name: 'Composite Panel Core', code: 'MFG-002', brand: 'Alstrong', category: 'Manufacturing Products', unit: 'SQM', price: 240, sold: 3580, growth: 16.8, status: 'Active', createdDate: dateOffset(-260), description: 'LDPE / mineral core stock for composite panel manufacturing.' },

  // ── Project Supply Materials ──
  { id: 'PRD-11', name: 'Cladding Fastener Set', code: 'PSM-001', brand: 'Hilti', category: 'Project Supply Materials', unit: 'SET', price: 1250, sold: 760, growth: 7.5, status: 'Active', createdDate: dateOffset(-230), description: 'Stainless fastener & rivet kit for cladding installation.' },
  { id: 'PRD-12', name: 'Structural Sealant', code: 'PSM-002', brand: 'Dow', category: 'Project Supply Materials', unit: 'LTR', price: 690, sold: 1980, growth: 10.2, status: 'Active', createdDate: dateOffset(-200), description: 'Weatherproof structural silicone sealant.' },
  { id: 'PRD-13', name: 'Sub-frame Channel', code: 'PSM-003', brand: 'Jindal', category: 'Project Supply Materials', unit: 'PCS', price: 320, sold: 2840, growth: -3.2, status: 'Inactive', createdDate: dateOffset(-180), description: 'Galvanised sub-frame channel for facade support.' },

  // ── Distribution Products ──
  { id: 'PRD-14', name: 'Coil Coated Aluminium', code: 'DST-001', brand: 'Hindalco', category: 'Distribution Products', unit: 'SQM', price: 410, sold: 4360, growth: 19.4, status: 'Active', createdDate: dateOffset(-150), description: 'PVDF coil-coated aluminium for distribution & resale.' },
  { id: 'PRD-15', name: 'Polyethylene Core Roll', code: 'DST-002', brand: 'Supreme', category: 'Distribution Products', unit: 'ROLL', price: 2100, sold: 540, growth: 13.6, status: 'Active', createdDate: dateOffset(-120), description: 'PE core roll stock for panel lamination.' },
]

export const productById = (pid) => products.find((p) => p.id === pid)
export const productOptions = products.map((p) => ({ value: p.id, label: p.name }))
export const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))

// revenue derived from price * sold
export const productsWithRevenue = products
  .map((p) => ({ ...p, revenue: p.price * p.sold }))
  .sort((a, b) => b.revenue - a.revenue)

export default products
