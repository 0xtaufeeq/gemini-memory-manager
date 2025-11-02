import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const maxDuration = 30

// Function to check if memories are relevant to the conversation
async function getRelevantMemories(messages: any[], memories: any[]) {
  if (!memories || memories.length === 0) return []
  
  // Get the last few messages to understand context
  const recentMessages = messages.slice(-3).map(m => m.content).join(' ')
  
  // Keywords that suggest memory relevance
  const personalQuestions = [
    'what do you know about me', 'tell me about myself', 'my preferences', 
    'recommend', 'suggest', 'what should i', 'help me choose', 'favorite',
    'favourite', 'favoruite', 'what is my', 'what\'s my', 'do i like',
    'i like', 'i love', 'i hate', 'i prefer', 'remember', 'about me',
    'my animal', 'my color', 'my food', 'what do i', 'tell me what i'
  ]
  
  const conversationText = recentMessages.toLowerCase()
  
  // Only include memories if the conversation seems personal/recommendation-based
  const isPersonalConversation = personalQuestions.some(keyword => 
    conversationText.includes(keyword)
  )
  
  if (!isPersonalConversation) {
    // For non-personal conversations, check if memories are semantically relevant
    return memories.filter(memory => {
      const memoryContent = memory.content.toLowerCase()
      const memoryWords = memoryContent.split(' ')
      
      // Check if any memory words appear in the conversation
      const hasDirectMatch = memoryWords.some((word: string) => conversationText.includes(word))
      
      // Special semantic matching for common questions
      const isAnimalQuestion = conversationText.includes('animal') && memoryContent.includes('cat')
      const isColorQuestion = conversationText.includes('color') && memoryContent.includes('black')
      const isFoodQuestion = (conversationText.includes('food') || conversationText.includes('eat')) && 
                           (memoryContent.includes('paneer') || memoryContent.includes('vegetarian'))
      
      return hasDirectMatch || isAnimalQuestion || isColorQuestion || isFoodQuestion
    })
  }
  
  return memories // Return all memories for personal conversations
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()
    
  
    console.log(`🤖 API Request - Model: ${model}, Messages: ${messages.length}`)

    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("Gemini API key not configured", { status: 500 })
    }

    // Fetch current memories from Supabase
    const { data: memories, error: memoryError } = await supabaseAdmin
      .from('memories')
      .select('content, category')
      .order('created_at', { ascending: false })
      .limit(100)

    if (memoryError) {
      console.error('❌ Error fetching memories:', memoryError)
    }

    // Get only relevant memories for this conversation
    const relevantMemories = await getRelevantMemories(messages, memories || [])
    
    console.log('🧠 Total memories:', memories?.length || 0)
    console.log('🎯 Relevant memories for this conversation:', relevantMemories.length)
    if (relevantMemories.length > 0) {
      console.log('📝 Using memories:', relevantMemories.map(m => `${m.content} (${m.category})`))
    }

    // Get the latest user message for memory extraction
    const latestUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    
    // Extract memories from the latest user message (run in background)
    if (latestUserMessage?.content) {

      // Call memory extraction API asynchronously (don't wait)
      fetch(`${req.nextUrl.origin}/api/memory-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: latestUserMessage.content })
      }).then(response => {
        console.log('📡 Memory extraction response status:', response.status)
        return response.json()
      }).then(data => {
        console.log('📝 Memory extraction result:', data)
      }).catch(error => {
        console.error('❌ Background memory extraction failed:', error)
      })
    }

    // Build memory context ONLY if we have relevant memories
    const memoryContext = relevantMemories && relevantMemories.length > 0
      ? `\n\nRelevant information about the user:\n${relevantMemories
          .map((m: any) => `- ${m.content} (${m.category})`)
          .join("\n")}`
      : ""

    const systemMessage = {
      role: "system",
      content: `You are Gemini, a helpful AI assistant. Be conversational and helpful.

${memoryContext ? `Use the following information about the user ONLY when it's directly relevant to their question or request:${memoryContext}

Guidelines for using memories:
- Only reference memories when they help answer the current question
- Don't force memories into unrelated conversations  
- For general questions, answer normally without mentioning personal details
- For recommendations or personal questions, use relevant memories to personalize your response` : 'Answer questions helpfully without assuming personal details about the user.'}`,
    }

    const result = streamText({
      model: google(model || "gemini-2.5-flash"),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      maxTokens: 4000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return new Response("Invalid or missing API key", { status: 401 })
      }
      if (error.message.includes("quota")) {
        return new Response("API quota exceeded", { status: 429 })
      }
    }
    
    return new Response("Internal Server Error", { status: 500 })
  }
}
