"use client"

import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"
import { MagicCard } from "@/components/ui/magic-card"

// Sample comparison datasets (Baseline vs Memory Layer)
const personalizationData = [
  { label: "Q1", Baseline: 62, Memory: 76 },
  { label: "Q2", Baseline: 63, Memory: 78 },
  { label: "Q3", Baseline: 64, Memory: 79 },
  { label: "Q4", Baseline: 65, Memory: 81 },
]

const tokenSavingsData = [
  { label: "Turn 1", Savings: 24 },
  { label: "Turn 2", Savings: 28 },
  { label: "Turn 3", Savings: 33 },
  { label: "Turn 4", Savings: 37 },
  { label: "Turn 5", Savings: 41 },
]

const hallucinationData = [
  { label: "Week 1", Baseline: 9.1, Memory: 6.8 },
  { label: "Week 2", Baseline: 9.0, Memory: 6.2 },
  { label: "Week 3", Baseline: 8.9, Memory: 5.9 },
  { label: "Week 4", Baseline: 8.8, Memory: 5.5 },
]

const latencyData = [
  { label: "p50", Baseline: 210, Memory: 222 },
  { label: "p75", Baseline: 290, Memory: 305 },
  { label: "p90", Baseline: 380, Memory: 410 },
  { label: "p95", Baseline: 460, Memory: 505 },
]

const axisTick = { fill: "#a1a1aa", fontSize: 12 }
const gridStroke = "#27272a"
const baselineColor = "#94a3b8"
const memoryColor = "#60a5fa"
const accentColor = "#a78bfa"

export default function MetricsPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedGridPattern numSquares={12} maxOpacity={0.05} duration={6} className="inset-0" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3 text-white">Metrics</h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            Visualizing impact of the memory layer versus a no‑memory baseline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <MagicCard className="p-6 border-white/10 bg-white/5">
            <div className="relative z-10">
              <h2 className="text-lg font-medium text-white mb-2 tracking-tight">Personalization lift (task success, %)</h2>
              <p className="text-sm text-zinc-400 mb-4">Higher is better</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={personalizationData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ color: "#a1a1aa" }} />
                    <Bar dataKey="Baseline" fill={baselineColor} radius={4} />
                    <Bar dataKey="Memory" fill={memoryColor} radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="p-6 border-white/10 bg-white/5">
            <div className="relative z-10">
              <h2 className="text-lg font-medium text-white mb-2 tracking-tight">Token savings from relevance gating (%)</h2>
              <p className="text-sm text-zinc-400 mb-4">Higher is better</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tokenSavingsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="Savings" stroke={accentColor} fillOpacity={1} fill="url(#colorSavings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="p-6 border-white/10 bg-white/5">
            <div className="relative z-10">
              <h2 className="text-lg font-medium text-white mb-2 tracking-tight">Hallucination rate (%, lower is better)</h2>
              <p className="text-sm text-zinc-400 mb-4">Memory layer reduces unsupported claims</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hallucinationData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ color: "#a1a1aa" }} />
                    <Line type="monotone" dataKey="Baseline" stroke={baselineColor} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Memory" stroke={memoryColor} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="p-6 border-white/10 bg-white/5">
            <div className="relative z-10">
              <h2 className="text-lg font-medium text-white mb-2 tracking-tight">Latency distribution (ms)</h2>
              <p className="text-sm text-zinc-400 mb-4">Slight overhead for memory processing at higher percentiles</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latencyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ color: "#a1a1aa" }} />
                    <Bar dataKey="Baseline" fill={baselineColor} radius={4} />
                    <Bar dataKey="Memory" fill={memoryColor} radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </div>
  )
}


