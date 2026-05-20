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
  index: number
  label: string         // "J1", "J2"…
  points: number
  position: number
  cumulative: number
}



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
    yAxisInverted: false,
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

  // Journée pas encore jouée → tooltip "À venir"
  if (value === null || value === undefined) {
    return (
      <div className="bg-bg-elevated border border-white/10 rounded-lg px-4 py-3 shadow-2xl ">
        <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
          Journée {data.index}
        </p>
        <p className="text-sm text-text-muted italic">
          À venir
        </p>
      </div>
    )
  }

  return (
    <div className="bg-bg-elevated border border-white/10 rounded-lg px-4 py-3 shadow-2xl h-full">
<p className="text-xs uppercase tracking-widest text-text-muted mb-1">
  Journée {data.index}
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

type DashboardChartProps = {
  data: DataPoint[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  const [selectedTrend, setSelectedTrend] = useState<TrendKey>("points")
  const trend = trends.find((t) => t.key === selectedTrend)!
  // ============================================
  // ÉTEND la fenêtre à minimum 10 journées
  // ============================================
  // Si on a moins de 10 journées jouées, on complète avec des "emplacements
  // vides" (label J4-J10 mais valeurs null) pour garder une base visuelle.
  // Au-delà de 10 journées jouées, on affiche tout naturellement.
  const MIN_VISIBLE_MATCHDAYS = 10

  const displayData = (() => {
    if (data.length >= MIN_VISIBLE_MATCHDAYS) return data

    // On extrait les numéros de journée déjà présents dans data
    // (data.label est "J1", "J2"… on parse le chiffre)
    const presentNumbers = new Set(
      data.map((d) => parseInt(d.label.replace(/^J/, ""), 10))
    )

    const result: typeof data = []
    // On garantit J1 → J10 (ou jusqu'au max déjà présent si > 10)
    const maxNumber = Math.max(MIN_VISIBLE_MATCHDAYS, ...presentNumbers, 0)

    for (let i = 1; i <= maxNumber; i++) {
      const existing = data.find((d) => d.label === `J${i}`)
      if (existing) {
        result.push(existing)
      } else {
        // Emplacement vide : valeurs null pour que Recharts ne dessine rien
        // mais garde l'axe X étiqueté
        result.push({
          index: i,
          label: `J${i}`,
          // @ts-expect-error Recharts accepte null pour ne pas tracer
          points: null,
          // @ts-expect-error
          position: null,
          // @ts-expect-error
          cumulative: null,
        })
      }
    }

    return result
  })()
  if (data.length === 0) {
    return (
        <div className="rounded-2xl bg-black/15 border border-white/10 backdrop-blur-xl p-6 md:p-8 h-full flex flex-col">
          
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Évolution sur la saison
          </p>
          <h2 className="text-2xl font-bold text-text-primary">
            En attente
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-center min-h-[240px]">
          <p className="text-text-muted text-sm">
            Le graphique apparaîtra après la première journée jouée
          </p>
        </div>
      </div>
    )
  }

  return (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8 h-full flex flex-col overflow-hidden">
        <div className="absolute top-2/3 h-full w-full bg-gradient-to-t from-accent to-transparent rounded-full blur-3xl pointer-events-none isolate" />


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
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          {trend.type === "bar" ? (
            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#e5e5e5"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#e5e5e5"
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
            <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#e5e5e5"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#e5e5e5"
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
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trend.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={trend.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#e5e5e5"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#e5e5e5"
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