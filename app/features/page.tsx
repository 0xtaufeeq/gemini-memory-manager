"use client"

import React from "react"
import { MagicCard } from "@/components/ui/magic-card"
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Zap,
  Shield,
  Database,
  Sparkles,
  Lock,
  TrendingUp,
  Globe,
  MessageSquare,
  MemoryStick,
  CheckCircle2,
  ArrowRight,
  Users,
  Settings,
  Clock,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    id: 1,
    title: "Persistent Memory System",
    description: "AI that remembers your preferences, learns from conversations, and provides personalized responses across sessions.",
    icon: MemoryStick,
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-500",
    size: "large",
  },
  {
    id: 2,
    title: "Smart Memory Extraction",
    description: "Automatically identifies and extracts memory-worthy information using AI-powered sentinel and knowledge extraction.",
    icon: Sparkles,
    gradientFrom: "from-purple-500",
    gradientTo: "to-pink-500",
    size: "medium",
  },
  {
    id: 3,
    title: "Relevance Filtering",
    description: "Intelligently filters and injects only relevant memories into conversations, ensuring accuracy and reducing noise.",
    icon: Zap,
    gradientFrom: "from-yellow-500",
    gradientTo: "to-orange-500",
    size: "medium",
  },
  {
    id: 4,
    title: "Privacy-First Architecture",
    description: "Secure memory storage with fine-grained control over what's remembered and when it's used in conversations.",
    icon: Shield,
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-500",
    size: "small",
  },
  {
    id: 5,
    title: "Real-Time Streaming",
    description: "Experience instant, streaming AI responses powered by Google Gemini 2.5 Pro and Flash models.",
    icon: MessageSquare,
    gradientFrom: "from-indigo-500",
    gradientTo: "to-blue-500",
    size: "small",
  },
  {
    id: 6,
    title: "Supabase Integration",
    description: "Robust database backend with automatic CRUD operations for seamless memory management at scale.",
    icon: Database,
    gradientFrom: "from-teal-500",
    gradientTo: "to-cyan-500",
    size: "small",
  },
  {
    id: 7,
    title: "Memory Management",
    description: "Create, update, and delete memories with fuzzy matching. Full control over your AI's knowledge base.",
    icon: Settings,
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-500",
    size: "large",
  },
  {
    id: 8,
    title: "Enterprise Ready",
    description: "Built for production with error handling, audit trails, and compliance-ready architecture for healthcare, fintech, and more.",
    icon: Globe,
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-500",
    size: "medium",
  },
]

const useCases = [
  {
    title: "Customer Support",
    description: "Remember user preferences, device history, and past issues for faster, personalized resolutions.",
  },
  {
    title: "Healthcare",
    description: "Track patient preferences, allergies, and lifestyle context with HIPAA-compliant privacy controls.",
  },
  {
    title: "Financial Services",
    description: "Personalized financial guidance with KYC-aware memory and auditable preference tracking.",
  },
  {
    title: "Education",
    description: "Adaptive learning with learner profiles, progress tracking, and personalized tutoring experiences.",
  },
]

const metrics = [
  { value: "100+", label: "Memories Processed" },
  { value: "99.9%", label: "Uptime" },
  { value: "<100ms", label: "Response Time" },
  { value: "5x", label: "Efficiency Gain" },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedGridPattern
        numSquares={14}
        maxOpacity={0.05}
        duration={6}
        className="inset-0"
      />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-20 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 text-white">
            Features
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            A focused, privacy‑first memory layer for AI. Designed for clarity, built for scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-100">
              <Link href="/">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-zinc-800 text-white hover:bg-white/5">
              <Link href="/#demo">View demo</Link>
            </Button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16 lg:mb-24">
          {features.map((feature) => {
            const Icon = feature.icon
            // Apple-style restraint: uniform cards, consistent rhythm
            const sizeClasses = { large: "", medium: "", small: "" }

            return (
              <MagicCard
                key={feature.id}
                className={`p-6 sm:p-8 flex flex-col h-full ${sizeClasses[feature.size as keyof typeof sizeClasses]} border-white/10 bg-white/5`}
                gradientFrom="from-white/10"
                gradientTo="to-white/0"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4 sm:mb-5">
                    <div className="inline-flex p-2 rounded-lg bg-white/10 ring-1 ring-white/10 mb-4">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-medium mb-2 sm:mb-3 text-white tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center text-xs sm:text-sm text-zinc-500">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span>Production‑ready</span>
                    </div>
                  </div>
                </div>
              </MagicCard>
            )
          })}
        </div>

        {/* Use Cases Section */}
        <div className="mb-16 lg:mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
              Built for real workflows
            </h2>
            <p className="text-zinc-400 text-base">
              Personalization without compromise—across support, health, finance, and education
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <MagicCard
                key={index}
                className="p-6 h-full border-white/10 bg-white/5"
                gradientFrom="from-white/8"
                gradientTo="to-white/0"
              >
                <div className="relative z-10">
                  <div className="mb-4">
                    <div className="inline-flex p-2 rounded-lg bg-white/10 ring-1 ring-white/10 mb-3">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white tracking-tight">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </MagicCard>
            ))}
          </div>
        </div>

        

        
      </div>
    </div>
  )
}

