# 🧠 Gemini Memory Manager

> **Advanced AI Chat Interface with Persistent Memory System**

A Next.js application that creates an intelligent chat interface using Google's Gemini AI with a revolutionary persistent memory system.

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-purple)](https://ai.google.dev/)

## ✨ Features

### 🧠 **Intelligent Memory System**
- **Persistent Memory**: AI remembers your preferences, habits, and previous conversations
- **Smart Categorization**: Automatically organizes memories by type (likes, attributes, facts)
- **Context Awareness**: Uses relevant memories to provide personalized responses
- **Memory Management**: Edit, delete, and organize your stored memories

### 💬 **Advanced Chat Interface**
- **Multiple Gemini Models**: Support for Gemini 1.5 Pro, Flash, 2.0 Flash, and 2.5 Pro/Flash
- **Real-time Conversations**: Instant responses with streaming capabilities
- **Session Management**: Save, load, and organize conversation sessions
- **Markdown Support**: Rich text formatting with code highlighting

### 🎨 **Professional UI/UX**
- **Resizable Sidebar**: Drag-to-resize interface with smooth animations
- **Dark Theme**: Sophisticated dark design with glassmorphism effects
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Loading Animations**: Professional loading states and transitions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Google AI Studio API key

### 1. Clone & Install

```bash
git clone https://github.com/0xtaufeeq/gemini-memory-manager.git
cd gemini-memory-manager
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
# Gemini AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Database Setup

#### Supabase Tables

**Memories Table:**
```sql
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT,
  importance INTEGER DEFAULT 1
);
```

**Chat Sessions Table:**
```sql
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT
);
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **AI Integration**: Google Gemini AI SDK, Vercel AI SDK
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google OAuth
- **Deployment**: Vercel/Netlify Ready

### Project Structure

```
gemini-memory-manager/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # NextAuth configuration
│   │   ├── chat/              # Chat API endpoint
│   │   ├── chat-sessions/     # Session management
│   │   ├── memories/          # Memory CRUD operations
│   │   └── memory-extract/    # Memory extraction logic
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main chat interface
│   └── providers.tsx          # Context providers
├── components/
│   ├── ui/                    # Reusable UI components
│   └── theme-provider.tsx     # Theme management
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## 🔧 Configuration

### Gemini AI Models

The application supports multiple Gemini models:

- **gemini-1.5-pro**: Best for complex reasoning
- **gemini-1.5-flash**: Fastest responses
- **gemini-2.0-flash-exp**: Latest experimental features
- **gemini-2.5-pro**: Advanced capabilities
- **gemini-2.5-flash**: Balanced performance

### Memory System

The AI automatically extracts and categorizes memories:

- **Likes**: Preferences and things you enjoy
- **Attributes**: Personal characteristics and traits  
- **Facts**: Important information about you
- **Skills**: Abilities and expertise

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google AI](https://ai.google.dev/) for Gemini AI API
- [Vercel](https://vercel.com/) for AI SDK and deployment platform
- [Supabase](https://supabase.com/) for database and authentication
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

- Create an [Issue](https://github.com/0xtaufeeq/gemini-memory-manager/issues)

```

