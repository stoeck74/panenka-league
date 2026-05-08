"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

// ============================================
// TYPES & FAKE DATA
// ============================================

type DataPoint = {
  matchday: number
  points: number
  position: number
  cumulative: number
}

// 38 journées (saison Ligue 1 complète)
// Les 22 premières ont des données, les suivantes sont à null (futur)
const fakeChartData: DataPoint[] = [
  { matchday: 1, points: 4, position: 5, cumulative: 4 },
  { matchday: 2, points: 1, position: 6, cumulative: 5 },
  { matchday: 3, points: 6, position: 4, cumulative: 11 },
  { matchday: 4, points: 3, position: 4, cumulative: 14 },
  { matchday: 5, points: 0, position: 5, cumulative: 14 },
  { matchday: 6, points: 8, position: 3, cumulative: 22 },
  { matchday: 7, points: 2, position: 4, cumulative: 24 },
  { matchday: 8, points: 5, position: 3, cumulative: 29 },
  { matchday: 9, points: 1, position: 4, cumulative: 30 },
  { matchday: 10, points: 4, position: 3, cumulative: 34 },
  { matchday: 11, points: 0, position: 5, cumulative: 34 },
  { matchday: 12, points: 7, position: 3, cumulative: 41 },
  { matchday: 13, points: 1, position: 4, cumulative: 42 },
  { matchday: 14, points: 0, position: 5, cumulative: 42 },
  { matchday: 15, points: 6, position: 3, cumulative: 48 },
  { matchday: 16, points: 3, position: 3, cumulative: 51 },
  { matchday: 17, points: 0, position: 4, cumulative: 51 },
  { matchday: 18, points: 4, position: 3, cumulative: 55 },
  { matchday: 19, points: 2, position: 4, cumulative: 57 },
  { matchday: 20, points: 1, position: 4, cumulative: 58 },
  { matchday: 21, points: 5, position: 3, cumulative: 63 },
]

// ============================================
// CONFIG DES TRENDS
// ============================================

type TrendKey = "points" | "position" | "cumulative"

type TrendConfig = {
  key: TrendKey
  label: string
  description: string
  type: "bar" | "line" | "area"
  color: string
  yAxisInverted?: boolean
}

const trends: TrendConfig[] = [
  {
    key: "points",
    label: "Points",
    description: "Points marqués par journée",
    type: "bar",
    color: "#A8FF00",
  },
  {
    key: "position",
    label: "Classement",
    description: "Position dans le classement",
    type: "line",
    color: "#A8FF00",
    yAxisInverted: true,
  },
  {
    key: "cumulative",
    label: "Cumul",
    description: "Total points cumulés",
    type: "area",
    color: "#A8FF00",
  },
]

// ============================================
// CUSTOM TOOLTIP
// ============================================

type TooltipProps = {
  active?: boolean
  payload?: Array<{ value: number; payload: DataPoint }>
  trend: TrendConfig
}

function CustomTooltip({ active, payload, trend }: TooltipProps) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const value = payload[0].value

  return (
    <div className="bg-bg-elevated border border-white/10 rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
        Journée {data.matchday}
      </p>
      <p className="text-2xl font-bold text-accent">
        {trend.key === "position" ? `${value}e` : value}
        {trend.key === "points" && <span className="text-base text-text-muted ml-1">pts</span>}
        {trend.key === "cumulative" && <span className="text-base text-text-muted ml-1">pts</span>}
      </p>
    </div>
  )
}

// ============================================
// COMPONENT
// ============================================

export function DashboardChart() {
  const [selectedTrend, setSelectedTrend] = useState<TrendKey>("points")
  const trend = trends.find((t) => t.key === selectedTrend)!

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8">

      {/* Header avec switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Évolution sur la saison
          </p>
          <h2 className="text-2xl font-bold text-text-primary">
            {trend.description}
          </h2>
        </div>

        {/* Switcher */}
        <div className="flex gap-1 bg-black/30 border border-white/5 rounded-lg p-1">
          {trends.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedTrend(t.key)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedTrend === t.key
                  ? "bg-accent text-bg"
                  : "text-text-secondary hover:text-text-primary"
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {trend.type === "bar" ? (
            <BarChart data={fakeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="matchday"
                stroke="#525252"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#525252"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip trend={trend} />} cursor={{ fill: "rgba(168,255,0,0.05)" }} />
              <Bar
                dataKey={trend.key}
                fill={trend.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : trend.type === "line" ? (
            <LineChart data={fakeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="matchday"
                stroke="#525252"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#525252"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                reversed={trend.yAxisInverted}
              />
              <Tooltip content={<CustomTooltip trend={trend} />} cursor={{ stroke: "rgba(168,255,0,0.2)" }} />
              <Line
                type="monotone"
                dataKey={trend.key}
                stroke={trend.color}
                strokeWidth={2}
                dot={{ fill: trend.color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={fakeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trend.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={trend.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="matchday"
                stroke="#525252"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#525252"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip trend={trend} />} cursor={{ stroke: "rgba(168,255,0,0.2)" }} />
              <Area
                type="monotone"
                dataKey={trend.key}
                stroke={trend.color}
                strokeWidth={2}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  )
}