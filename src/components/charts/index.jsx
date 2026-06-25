import { useId } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

import { CHART_COLORS, CHART_GRID } from '@/constants'
import { cn } from '@/utils/cn'

/* ------------------------------------------------------------------ */
/* Shared themed primitives                                            */
/* ------------------------------------------------------------------ */

const AXIS_TICK = { fontSize: 12, fill: '#6b7280' }
const AXIS_PROPS = { tickLine: false, axisLine: false, tick: AXIS_TICK }

const colorAt = (i, palette = CHART_COLORS) => palette[i % palette.length]

const hasData = (data) => Array.isArray(data) && data.length > 0

/** Friendly empty placeholder so charts never crash on missing data. */
function ChartEmpty({ height }) {
  return (
    <div
      className="flex w-full items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted/40 text-sm text-ink-faint dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500"
      style={{ height }}
    >
      No data to display
    </div>
  )
}

/** Premium rounded tooltip shared by every chart view. */
function ThemedTooltip({ active, payload, label, formatter, hideLabel }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="min-w-[10rem] rounded-xl border border-line bg-white/95 px-3 py-2.5 shadow-card backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
      {!hideLabel && label != null && label !== '' && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft dark:text-slate-400">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const color = entry.color || entry.fill || entry.payload?.fill || colorAt(i)
          const name = entry.name ?? entry.dataKey
          const raw = entry.value
          const value = formatter ? formatter(raw, name, entry) : raw
          return (
            <div key={`${name}-${i}`} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-ink-soft dark:text-slate-400">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{name}</span>
              </span>
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const legendStyle = { fontSize: 12, paddingTop: 8 }

function renderLegendText(value) {
  return <span className="text-xs text-ink-soft dark:text-slate-400">{value}</span>
}

/* ------------------------------------------------------------------ */
/* AreaChartView                                                       */
/* ------------------------------------------------------------------ */

export function AreaChartView({
  data,
  xKey,
  areas,
  dataKey,
  color,
  name,
  height = 300,
  stacked = false,
  gradient = true,
  showLegend = false,
  tooltipFormatter,
  className,
}) {
  const gradId = useId()

  if (!hasData(data)) return <ChartEmpty height={height} />

  // Normalize: accept either `areas[]` or a single `dataKey`/`color`.
  const series =
    Array.isArray(areas) && areas.length > 0
      ? areas
      : dataKey
        ? [{ key: dataKey, color, name }]
        : []

  if (series.length === 0) return <ChartEmpty height={height} />

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            {series.map((s, i) => {
              const c = s.color || colorAt(i)
              return (
                <linearGradient key={`${gradId}-${i}`} id={`${gradId}-area-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={gradient ? 0.35 : 0.12} />
                  <stop offset="100%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              )
            })}
          </defs>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} dy={6} />
          <YAxis {...AXIS_PROPS} width={48} />
          <Tooltip
            cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
            content={<ThemedTooltip formatter={tooltipFormatter} />}
          />
          {showLegend && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} formatter={renderLegendText} />
          )}
          {series.map((s, i) => {
            const c = s.color || colorAt(i)
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name || s.key}
                stackId={stacked ? 'stack' : undefined}
                stroke={c}
                strokeWidth={2.5}
                fill={`url(#${gradId}-area-${i})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* LineChartView                                                       */
/* ------------------------------------------------------------------ */

export function LineChartView({
  data,
  xKey,
  lines,
  dataKey,
  color,
  name,
  height = 300,
  smooth = true,
  showLegend = false,
  tooltipFormatter,
  className,
}) {
  if (!hasData(data)) return <ChartEmpty height={height} />

  const series =
    Array.isArray(lines) && lines.length > 0
      ? lines
      : dataKey
        ? [{ key: dataKey, color, name }]
        : []

  if (series.length === 0) return <ChartEmpty height={height} />

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} dy={6} />
          <YAxis {...AXIS_PROPS} width={48} />
          <Tooltip
            cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
            content={<ThemedTooltip formatter={tooltipFormatter} />}
          />
          {showLegend && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} formatter={renderLegendText} />
          )}
          {series.map((s, i) => {
            const c = s.color || colorAt(i)
            return (
              <Line
                key={s.key}
                type={smooth ? 'monotone' : 'linear'}
                dataKey={s.key}
                name={s.name || s.key}
                stroke={c}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BarChartView                                                        */
/* ------------------------------------------------------------------ */

export function BarChartView({
  data,
  xKey,
  bars,
  dataKey,
  color,
  name,
  height = 300,
  stacked = false,
  horizontal = false,
  radius = 6,
  showLegend = false,
  tooltipFormatter,
  className,
}) {
  if (!hasData(data)) return <ChartEmpty height={height} />

  const series =
    Array.isArray(bars) && bars.length > 0
      ? bars
      : dataKey
        ? [{ key: dataKey, color, name }]
        : []

  if (series.length === 0) return <ChartEmpty height={height} />

  const layout = horizontal ? 'vertical' : 'horizontal'

  // For multi-series non-stacked bars keep them slim; rounded corners on top (or right when horizontal).
  const barRadius = horizontal ? [0, radius, radius, 0] : [radius, radius, 0, 0]

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 8, left: horizontal ? 8 : -8, bottom: 0 }}
          barGap={4}
          barCategoryGap="22%"
        >
          <CartesianGrid
            stroke={CHART_GRID}
            strokeDasharray="3 3"
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {horizontal ? (
            <>
              <XAxis type="number" {...AXIS_PROPS} />
              <YAxis type="category" dataKey={xKey} {...AXIS_PROPS} width={96} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS_PROPS} dy={6} />
              <YAxis {...AXIS_PROPS} width={48} />
            </>
          )}
          <Tooltip
            cursor={{ fill: 'rgba(54,186,179,0.06)' }}
            content={<ThemedTooltip formatter={tooltipFormatter} />}
          />
          {showLegend && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} formatter={renderLegendText} />
          )}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name || s.key}
              stackId={stacked ? 'stack' : undefined}
              fill={s.color || colorAt(i)}
              radius={barRadius}
              maxBarSize={horizontal ? 26 : 44}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* PieChartView                                                        */
/* ------------------------------------------------------------------ */

export function PieChartView({
  data,
  dataKey,
  nameKey,
  colors = CHART_COLORS,
  height = 300,
  donut = true,
  showLegend = true,
  tooltipFormatter,
  className,
}) {
  if (!hasData(data)) return <ChartEmpty height={height} />

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={donut ? '58%' : 0}
            outerRadius="80%"
            paddingAngle={donut ? 3 : 1}
            cornerRadius={donut ? 6 : 0}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill || entry.color || colorAt(i, colors)} />
            ))}
          </Pie>
          <Tooltip content={<ThemedTooltip hideLabel formatter={tooltipFormatter} />} />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={legendStyle}
              formatter={renderLegendText}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* RadialChartView                                                     */
/* ------------------------------------------------------------------ */

export function RadialChartView({
  data,
  dataKey,
  nameKey,
  height = 300,
  colors = CHART_COLORS,
  showLegend = true,
  className,
}) {
  if (!hasData(data)) return <ChartEmpty height={height} />

  // Inject a fill per row so each radial track is brand-themed.
  const themed = data.map((d, i) => ({
    ...d,
    fill: d.fill || d.color || colorAt(i, colors),
  }))

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          data={themed}
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="100%"
          barSize={14}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey={dataKey}
            nameKey={nameKey}
            background={{ fill: 'rgba(148,163,184,0.16)' }}
            cornerRadius={8}
            isAnimationActive
          >
            {themed.map((entry, i) => (
              <Cell key={`radial-cell-${i}`} fill={entry.fill} />
            ))}
          </RadialBar>
          <Tooltip content={<ThemedTooltip hideLabel />} />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, lineHeight: '20px' }}
              formatter={renderLegendText}
            />
          )}
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default {
  AreaChartView,
  LineChartView,
  BarChartView,
  PieChartView,
  RadialChartView,
}
