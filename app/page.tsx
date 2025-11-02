"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ScrollArea } from "@/components/ui/scroll-area"

import { MessageSquare, Plus, Trash2, Send, User, Bot, Menu, X, Edit2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface Message {
  id: string
  role: "user" | "assistant" | "system" | "data"
  content: string
  reasoning?: string
  timestamp?: Date
}

interface Memory {
  id: string
  content: string
  category: 'allergy' | 'like' | 'dislike' | 'attribute'
  created_at: string
  updated_at: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: Message[]
}

export default function GeminiMemoryManager() {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro")
  const [memories, setMemories] = useState<Memory[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(256) // 256px = w-64
  const [isResizing, setIsResizing] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [memoryProcessing, setMemoryProcessing] = useState(false)
  const [isAppLoading, setIsAppLoading] = useState(true)
  const [loadingText, setLoadingText] = useState("Initializing...")

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: "/api/chat",
    body: {
      model: selectedModel,
    },
    onFinish: (message) => {
      // Memory extraction happens asynchronously in background
      setMemoryProcessing(true)
      

      
      // Add delayed refresh to catch newly extracted memories
      setTimeout(() => {
        fetchMemories()
      }, 2000) // Wait 2 seconds for memory extraction to complete
      
      // Additional refresh for deletion requests (faster)
      setTimeout(() => {
        fetchMemories()
      }, 1000) // Quick refresh for deletions
      
      // Final refresh and stop processing indicator
      setTimeout(() => {
        fetchMemories()
        setMemoryProcessing(false)
      }, 5000)
      
      // Fallback to stop processing indicator in case of errors
      setTimeout(() => {
        setMemoryProcessing(false)
      }, 10000)
    },
  })

  // Custom submit handler that includes current model and memories
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    console.log(`🔄 Sending message with model: ${selectedModel}`)
    
    // Start memory processing indicator immediately
    setMemoryProcessing(true)
    
    // Store the input content before clearing
    const messageContent = input.trim()
    
    // Use the built-in handleSubmit to properly clear input and handle state
    handleSubmit(e, {
      body: {
        model: selectedModel,
      }
    })
  }

  // Save session whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const messagesWithTimestamps = messages.map(msg => ({
        ...msg,
        timestamp: new Date()
      }))
      saveCurrentSession(messagesWithTimestamps).catch(error => {
        console.error('❌ Error saving session:', error)
      })
    }
  }, [messages])

  // Log when model changes
  useEffect(() => {
    console.log(`🎯 Model changed to: ${selectedModel}`)
  }, [selectedModel])

  // Mock user data
  const mockUser = {
    name: "dev.user",
    image: "/placeholder.svg?height=32&width=32",
  }

  // Memory management functions
  const fetchMemories = async () => {
    try {
      const response = await fetch('/api/memories')
      if (response.ok) {
        const { memories } = await response.json()
        setMemories(memories)
        console.log('🔄 Memories refreshed, count:', memories.length)
        
        // If we just got new memories and processing was active, stop the indicator
        if (memoryProcessing && memories.length > 0) {
          setMemoryProcessing(false)
        }
      }
    } catch (error) {
      console.error('Error fetching memories:', error)
      setMemoryProcessing(false) // Stop processing on error
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      console.log('🗑️ Deleting memory:', memoryId)
      const response = await fetch(`/api/memories?id=${memoryId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        // Update UI immediately
        setMemories(prev => prev.filter(m => m.id !== memoryId))
        
        // Refresh from server to ensure consistency
        setTimeout(() => {
          fetchMemories()
        }, 200)
      } else {
        console.error('❌ Failed to delete memory:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error deleting memory:', error)
    }
  }

  const updateMemory = async (memoryId: string, content: string, category: string) => {
    try {
      const response = await fetch('/api/memories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memoryId, content, category })
      })
      if (response.ok) {
        const { memory } = await response.json()
        setMemories(prev => prev.map(m => m.id === memoryId ? memory : m))
        setEditingMemory(null)
        setEditContent("")
      }
    } catch (error) {
      console.error('Error updating memory:', error)
    }
  }

  const startEditMemory = (memory: Memory) => {
    setEditingMemory(memory.id)
    setEditContent(memory.content)
  }

  const saveMemoryEdit = (memory: Memory) => {
    if (editContent.trim()) {
      updateMemory(memory.id, editContent.trim(), memory.category)
    }
  }

  const cancelEdit = () => {
    setEditingMemory(null)
    setEditContent("")
  }

  // Migration helper to move localStorage data to Supabase
  const migrateLocalStorageData = async () => {
    try {
      console.log('🔄 Checking for localStorage migration...')
      
      // Check if there's existing localStorage data
      const savedSessions = localStorage.getItem("memory-manager-sessions")
      if (savedSessions) {
        const localSessions = JSON.parse(savedSessions)
        console.log('📦 Found localStorage sessions to migrate:', localSessions.length)
        
        // Migrate each session to Supabase
        for (const session of localSessions) {
          await createChatSession(session.title, session.messages)
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem("memory-manager-sessions")
        console.log('✅ Migration completed, localStorage cleared')
        
        // Refresh the sessions list
        await fetchChatSessions()
      } else {
        console.log('📱 No localStorage data to migrate')
      }
    } catch (error) {
      console.error('❌ Migration error:', error)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoadingText("Loading...")
        
        // Run memory and chat session fetching in parallel for faster loading
        const [_, __] = await Promise.all([
          fetchMemories(),
          fetchChatSessions()
        ])
        
        // Migrate localStorage data (usually quick)
        await migrateLocalStorageData()
        
        // Minimal delay to prevent flash
        setTimeout(() => {
          setIsAppLoading(false)
        }, 100)
      } catch (error) {
        console.error('❌ Error initializing app:', error)
        setIsAppLoading(false)
      }
    }
    
    initializeData()
  }, [])

  // Cleanup event listeners on unmount (handled in individual mouse events now)

  // Add body cursor style when resizing
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Chat session management functions
  const fetchChatSessions = async () => {
    try {
      console.log('📚 Fetching chat sessions from Supabase...')
      const response = await fetch('/api/chat-sessions')
      if (response.ok) {
        const { sessions } = await response.json()
        setChatSessions(sessions)
        console.log('📚 Chat sessions loaded:', sessions.length)
      }
    } catch (error) {
      console.error('❌ Error fetching chat sessions:', error)
    }
  }

  const createChatSession = async (title: string, messages: any[]) => {
    try {
      console.log('📝 Creating chat session:', title)
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, messages })
      })
      
      if (response.ok) {
        const { session } = await response.json()
        setChatSessions(prev => [session, ...prev])
        console.log('✅ Chat session created:', session.id)
        return session
      }
    } catch (error) {
      console.error('❌ Error creating chat session:', error)
    }
  }

  const updateChatSession = async (sessionId: string, messages: any[], title?: string) => {
    try {
      console.log('🔄 Updating chat session:', sessionId)
      const response = await fetch('/api/chat-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, messages, title })
      })
      
      if (response.ok) {
        const { session } = await response.json()
        setChatSessions(prev => prev.map(s => s.id === sessionId ? session : s))
        console.log('✅ Chat session updated:', sessionId)
        return session
      }
    } catch (error) {
      console.error('❌ Error updating chat session:', error)
    }
  }

  const deleteChatSession = async (sessionId: string) => {
    try {
      console.log('🗑️ Deleting chat session:', sessionId)
      const response = await fetch(`/api/chat-sessions?id=${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setChatSessions(prev => prev.filter(s => s.id !== sessionId))
        console.log('✅ Chat session deleted:', sessionId)
      }
    } catch (error) {
      console.error('❌ Error deleting chat session:', error)
    }
  }

  const saveCurrentSession = async (sessionMessages: Message[]) => {
    if (sessionMessages.length > 0) {
      const title = sessionMessages[0]?.content?.substring(0, 40) + "..." || "New Chat"
      
      if (currentSessionId) {
        // Update existing session
        await updateChatSession(currentSessionId, sessionMessages, title)
      } else {
        // Create new session
        const newSession = await createChatSession(title, sessionMessages)
        if (newSession) {
          setCurrentSessionId(newSession.id)
        }
      }
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentSessionId("")
  }

  const clearAllHistory = async () => {
    if (confirm("Are you sure you want to delete all chat history? This will only delete chats, not memories.")) {
      try {
        console.log('🗑️ Clearing all chat history...')
        
        // Clear all chat sessions from database
        const deleteSessionPromises = chatSessions.map(session => 
          fetch(`/api/chat-sessions?id=${session.id}`, { method: 'DELETE' })
        )
        await Promise.all(deleteSessionPromises)
        
        // Clear chat sessions UI
        setChatSessions([])
        setCurrentSessionId("")
        setMessages([])
        
        console.log('✅ All chat history cleared (memories preserved)')
      } catch (error) {
        console.error('❌ Error clearing chat history:', error)
      }
    }
  }

  const clearAllMemories = async () => {
    try {
      console.log('🗑️ Clearing all memories...')
      
      // Delete each memory individually (since we don't have a bulk delete endpoint)
      const deletePromises = memories.map(memory => 
        fetch(`/api/memories?id=${memory.id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      // Clear the UI
      setMemories([])
      console.log('✅ All memories cleared')
    } catch (error) {
      console.error('❌ Error clearing memories:', error)
    }
  }

  const deleteIndividualChat = async (sessionId: string, sessionTitle: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the chat load
    
    if (confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      await deleteChatSession(sessionId)
      
      // If we're deleting the current session, clear the chat
      if (currentSessionId === sessionId) {
        setCurrentSessionId("")
        setMessages([])
      }
    }
  }

  const loadChatSession = (session: ChatSession) => {
    setMessages(session.messages)
    setCurrentSessionId(session.id)
  }

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 15): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }

  // Sidebar resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(500, e.clientX)) // Min 240px, Max 500px (increased min width)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])



  return (
    <div className="h-screen min-h-screen bg-black text-white flex overflow-hidden relative">
      {/* Professional Loading Screen */}
      {isAppLoading && (
        <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="text-center space-y-6">
            {/* Minimal Spinner */}
            <div className="relative mx-auto w-8 h-8">
              <div className="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-zinc-400 rounded-full animate-spin"></div>
            </div>
            
            {/* Clean Loading Text */}
            <div className="space-y-2">
              <div className="text-zinc-300 text-sm font-medium">{loadingText}</div>
              <div className="w-32 h-0.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-zinc-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Overlay for Sidebar */}
      {sidebarOpen && (
        <div 
          className="lg:hidden absolute inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Overlay for Memory Panel */}
      {memoryOpen && (
        <div 
          className="lg:hidden absolute inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={() => setMemoryOpen(false)}
        />
      )}
      
      {/* Resize Overlay */}
      {isResizing && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-20 pointer-events-none" />
      )}
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:relative z-50 lg:z-auto transition-all duration-300 ease-out bg-black border-r border-zinc-800 flex flex-col overflow-hidden h-full 
        w-80 lg:w-auto ${!sidebarOpen ? "lg:w-0" : ""}`}
        style={{ 
          width: sidebarOpen ? `${sidebarWidth}px` : '0px',
          transition: isResizing ? 'none' : 'all 0.3s ease-out'
        }}
      >
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-sm overflow-hidden">
                <img src="/gemini.png" alt="Gemini" className="w-full h-full object-contain" />
              </div>
                              <span className="font-medium text-white">Memory Manager</span>
            </div>
                          <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 h-auto lg:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
          </div>
          <Button
            onClick={startNewChat}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 rounded-lg h-10 font-normal"
          >
            <Plus className="w-4 h-4 mr-2" />
            New chat
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <div key={session.id} className="group relative">
              <Button
                variant="ghost"
                  className={`w-full justify-start text-left h-auto p-3 pr-9 rounded-lg transition-colors ${
                  currentSessionId === session.id
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
                onClick={() => loadChatSession(session)}
                >
                  <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0 mr-1">
                    <div className="text-sm truncate">{truncateText(session.title)}</div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0.5 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400 hover:bg-red-500/10 p-1 h-auto w-7 flex-shrink-0"
                  onClick={(e) => deleteIndividualChat(session.id, session.title, e)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                </div>
            ))}
          </div>
        </ScrollArea>

        {/* Clear History Button */}
        {chatSessions.length > 0 && (
          <div className="p-4 border-t border-zinc-800">
            <Button
              onClick={clearAllHistory}
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all chats
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 text-center">
            made with <span className="text-zinc-400">&lt;/&gt;</span> and{" "}
            <span className="text-red-400">♥</span> by{" "}
            <a
              href="https://github.com/0xtaufeeq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white transition-colors underline"
            >
              Taufeeq Riyaz
            </a>
          </div>
        </div>

        {/* Resize Handle - Desktop Only */}
        {sidebarOpen && (
          <div
            className={`hidden lg:block absolute right-0 top-0 bottom-0 w-2 bg-transparent hover:bg-zinc-600/50 cursor-col-resize transition-colors z-10 ${
              isResizing ? 'bg-zinc-500/50' : ''
            }`}
            onMouseDown={handleMouseDown}
            style={{ cursor: 'col-resize' }}
          >
            {/* Visual grip indicator */}
            <div className="absolute right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-zinc-600 rounded-full opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-0.5 h-6 bg-zinc-300 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 sm:p-2 h-auto flex-shrink-0"
              >
                <Menu className="w-4 h-4" />
              </Button>

              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-32 sm:w-40 lg:w-48 bg-zinc-900 border-zinc-700 text-white text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="gemini-1.5-pro" className="text-white hover:bg-zinc-800 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Gemini 1.5 Pro</span>
                    <span className="sm:hidden">1.5 Pro</span>
                  </SelectItem>
                  <SelectItem value="gemini-1.5-flash" className="text-white hover:bg-zinc-800 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Gemini 1.5 Flash</span>
                    <span className="sm:hidden">1.5 Flash</span>
                  </SelectItem>
                  <SelectItem value="gemini-2.0-flash-exp" className="text-white hover:bg-zinc-800 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Gemini 2.0 Flash (Experimental)</span>
                    <span className="sm:hidden">2.0 Flash</span>
                  </SelectItem>
                  <SelectItem value="gemini-2.5-pro" className="text-white hover:bg-zinc-800 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Gemini 2.5 Pro</span>
                    <span className="sm:hidden">2.5 Pro</span>
                  </SelectItem>
                  <SelectItem value="gemini-2.5-flash" className="text-white hover:bg-zinc-800 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Gemini 2.5 Flash</span>
                    <span className="sm:hidden">2.5 Flash</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMemoryOpen(prev => !prev)}
            className={`p-1.5 sm:p-2 h-auto transition-colors relative flex-shrink-0 ${
              memoryOpen 
                ? "text-white bg-zinc-800" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <span className="text-xs sm:text-sm">Memory</span>
            {memoryProcessing && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {messages.length === 0 && (
              <div className="text-center py-12 sm:py-20">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 p-3 sm:p-4">
                  <img src="/gemini.png" alt="Gemini" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-xl sm:text-2xl font-medium mb-2 text-white">
                  How can I help you today?
                </h2>
                <p className="text-sm sm:text-base text-zinc-400">Start a conversation with Gemini Memory Manager</p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="group"
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.role === "user" ? (
                        <div className="w-7 sm:w-8 h-7 sm:h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-7 sm:w-8 h-7 sm:h-8 bg-white rounded-full flex items-center justify-center">
                          <Bot className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-black" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-medium text-zinc-300">
                        {message.role === "user" ? "You" : "Gemini"}
                      </div>
                      <div className="text-white leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            // Custom styling for code blocks
                            code: ({ node, className, children, ...props }: any) => {
                              const inline = (props as any)?.inline
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <pre className="bg-zinc-900 rounded-lg p-4 overflow-x-auto border border-zinc-800">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            // Custom styling for links
                            a: ({ children, ...props }: any) => (
                              <a className="text-blue-400 hover:text-blue-300 underline" {...props}>
                                {children}
                              </a>
                            ),
                            // Custom styling for lists
                            ul: ({ children, ...props }: any) => (
                              <ul className="list-disc list-inside space-y-1" {...props}>
                                {children}
                              </ul>
                            ),
                            ol: ({ children, ...props }: any) => (
                              <ol className="list-decimal list-inside space-y-1" {...props}>
                                {children}
                              </ol>
                            ),
                            // Custom styling for blockquotes
                            blockquote: ({ children, ...props }: any) => (
                              <blockquote className="border-l-4 border-zinc-600 pl-4 italic text-zinc-300" {...props}>
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    {message.reasoning && (
                        <div className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                          <div className="text-xs text-zinc-400 mb-2">
                          <span>Reasoning Process</span>
                        </div>
                          <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {message.reasoning}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>

            {isLoading && (
              <div className="group">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-black" />
                    </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-sm font-medium text-zinc-300">Gemini</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-zinc-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 flex-shrink-0">
          <form onSubmit={handleCustomSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
                <Input
                  value={input}
                onChange={handleInputChange}
                placeholder="Message Gemini Memory Manager..."
                className="w-full bg-zinc-900 border-zinc-700 text-white placeholder-zinc-400 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 focus:border-zinc-600 focus:ring-0 text-sm sm:text-base"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="sm"
                className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white hover:bg-zinc-200 text-black rounded-xl w-7 sm:w-8 h-7 sm:h-8 p-0 disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                <Send className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Memory Panel */}
      <div className={`${
          memoryOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        } fixed lg:relative right-0 top-0 z-50 lg:z-auto transition-all duration-300 ease-out bg-black border-l border-zinc-800 flex flex-col overflow-hidden h-full 
        w-80 lg:w-auto ${!memoryOpen ? "lg:w-0" : ""}`}>
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium text-white">
                Memory
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMemoryOpen(false)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 sm:p-1 h-auto"
              >
                <X className="w-5 sm:w-4 h-5 sm:h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                {memories.length} stored memories
              </p>
              <div className="flex items-center space-x-2">
                {memoryProcessing && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-400">Processing...</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Manual memory refresh')
                    fetchMemories()
                  }}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1 h-auto"
                  title="Refresh memories"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
        </div>

          <ScrollArea className="flex-1 p-4 overflow-hidden">
          <div className="space-y-3">
              {memories.map((memory) => (
                <div
                key={memory.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 group hover:bg-zinc-800/50 transition-colors"
              >
                  <div className="flex items-start justify-between mb-3">
                    {editingMemory === memory.id ? (
                      <div className="flex-1 pr-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="text-sm bg-zinc-800 border-zinc-700 text-white mb-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveMemoryEdit(memory)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveMemoryEdit(memory)}
                            className="h-6 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-white leading-relaxed flex-1 pr-2">{memory.content}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditMemory(memory)}
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 flex-shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMemory(memory.id)}
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-zinc-500 capitalize">
                      {memory.category}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {memories.length === 0 && !memoryProcessing && (
                <div className="text-center py-12">
                  <p className="text-sm text-zinc-400 mb-1">No memories yet</p>
                  <p className="text-xs text-zinc-500">Chat to build context</p>
                </div>
              )}
              {memories.length === 0 && memoryProcessing && (
                <div className="text-center py-12">
                  <div className="w-6 h-6 bg-blue-400 rounded-full animate-pulse mx-auto mb-2"></div>
                  <p className="text-sm text-blue-400 mb-1">Analyzing conversation...</p>
                  <p className="text-xs text-zinc-500">Looking for memories to save</p>
              </div>
            )}
          </div>
        </ScrollArea>

          {/* Clear All Memories Button - Bottom */}
          {memories.length > 0 && (
            <div className="p-4 border-t border-zinc-800">
              <Button
                onClick={() => {
                  if (confirm("Are you sure you want to delete ALL memories? This action cannot be undone.")) {
                    clearAllMemories()
                  }
                }}
                variant="ghost"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all memories
              </Button>
            </div>
          )}
      </div>
    </div>
  )
}
