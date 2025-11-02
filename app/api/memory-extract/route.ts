import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const model = google('gemini-2.5-flash')

// Memory categories and actions
type MemoryCategory = 'allergy' | 'like' | 'dislike' | 'attribute'
type MemoryAction = 'create' | 'update' | 'delete'

interface ExtractedMemory {
  content: string
  category: MemoryCategory
  action: MemoryAction
  oldContent?: string
}

// Sentinel: Check if message contains memory-worthy information
async function isMemoryWorthy(message: string): Promise<boolean> {
  const sentinelPrompt = `
Your job is to assess a message to determine if it contains any personal information worth remembering.

Look for ANY of these types of information:
1. Food preferences: likes, dislikes, allergies (e.g. "I love pizza", "I'm allergic to nuts", "I hate spicy food")
2. Personal attributes: location, family, lifestyle, diet (e.g. "I live in NYC", "I'm vegetarian", "I have kids")
3. Interests and hobbies: what they enjoy doing (e.g. "I love gaming", "I enjoy hiking")
4. Technology preferences: devices, brands, tools they like (e.g. "I love Samsung", "I use iPhone", "I prefer Windows")
5. Work or professional details (e.g. "I'm a developer", "I work from home")
6. Any other personal preference or characteristic
7. Memory management requests: asking to remember, forget, delete, or update information (e.g. "remember I like cats", "forget about my dog", "delete my vegetarian preference")

Message to analyze: "${message}"

If the message contains ANY personal information worth remembering OR requests to modify memories, respond with TRUE.
If it's just a question or general statement with no personal info or memory requests, respond with FALSE.

Examples:
- "I love Samsung devices" → TRUE (technology preference)
- "I'm vegetarian" → TRUE (dietary preference)  
- "What's the weather?" → FALSE (no personal info)
- "I hate spicy food" → TRUE (food preference)
- "Delete my memory about cats" → TRUE (memory management request)
- "Forget that I'm vegetarian" → TRUE (memory management request)
- "Remove my preference for Samsung" → TRUE (memory management request)

ONLY RESPOND WITH TRUE OR FALSE. No explanations.
`

  try {
    const result = await generateText({
      model,
      prompt: sentinelPrompt,
      temperature: 0
    })
    
    console.log('🤖 Sentinel response:', result.text)
    return result.text.toUpperCase().includes('TRUE')
  } catch (error) {
    console.error('❌ Sentinel error:', error)
    return false
  }
}

// Knowledge Master: Extract specific memories from message
async function extractMemories(message: string, existingMemories: string[]): Promise<ExtractedMemory[]> {
  const extractionPrompt = `
You are a memory extraction expert. Analyze the message for personal information worth storing.

Categories:
- "allergy": Food allergies (life-threatening) - only if certain it's an allergy, not just dislike
- "like": Things the person enjoys (food, technology, activities, brands, etc.)
- "dislike": Things the person dislikes or avoids (food, technology, activities, etc.)
- "attribute": Personal characteristics (location, family, job, lifestyle, diet, etc.)

Actions:
- "create": New information
- "update": Modify existing information  
- "delete": Remove specific memories (match keywords from deletion request to existing memories)

Current memories:
${existingMemories.map((mem, i) => `${i + 1}. ${mem}`).join('\n')}

For deletion requests, look for keywords in the user's message and match them to existing memories above. 
For example: "delete memory about cats" should match memory "loves cats" if it exists.

Message to analyze: "${message}"

Examples:
- "I love Samsung devices" → {"content": "loves Samsung devices", "category": "like", "action": "create"}
- "I'm allergic to nuts" → {"content": "allergic to nuts", "category": "allergy", "action": "create"}
- "I live in New York" → {"content": "lives in New York", "category": "attribute", "action": "create"}
- "I hate spicy food" → {"content": "dislikes spicy food", "category": "dislike", "action": "create"}
- "Delete my memory about cats" → {"content": "", "category": "like", "action": "delete", "oldContent": "loves cats"}
- "Forget that I'm vegetarian" → {"content": "", "category": "attribute", "action": "delete", "oldContent": "is a vegetarian"}  
- "Remove my Samsung preference" → {"content": "", "category": "like", "action": "delete", "oldContent": "loves Samsung devices"}
- "Delete the cat thing" → {"content": "", "category": "like", "action": "delete", "oldContent": "loves cats"} (fuzzy match)
- "Remove vegetarian" → {"content": "", "category": "attribute", "action": "delete", "oldContent": "is a vegetarian"} (fuzzy match)

Extract memories in this exact JSON format:
[
  {
    "content": "brief description in third person (e.g., 'loves Samsung devices', 'allergic to nuts')",
    "category": "allergy|like|dislike|attribute",
    "action": "create|update|delete",
    "oldContent": "exact text to replace (only for update/delete)"
  }
]

If no memories found, return: []

Respond ONLY with valid JSON array. No explanations.
`

  try {
    const result = await generateText({
      model,
      prompt: extractionPrompt,
      temperature: 0
    })
    
    console.log('🧠 Knowledge Master response:', result.text)
    
    // Parse JSON response
    const cleanJson = result.text.trim().replace(/```json\n?|\n?```/g, '')
    return JSON.parse(cleanJson) as ExtractedMemory[]
  } catch (error) {
    console.error('❌ Memory extraction error:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    const hasGeminiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔧 Environment check:', { hasGeminiKey, hasSupabaseUrl, hasSupabaseKey })
    
    if (!hasGeminiKey) {
      console.error('❌ Missing GOOGLE_GENERATIVE_AI_API_KEY')
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error('❌ Missing Supabase credentials')
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log('🧠 Analyzing message for memories:', message)

    // Step 1: Check if message contains memory-worthy information
    const isWorthy = await isMemoryWorthy(message)
    
    if (!isWorthy) {
      console.log('❌ No memory-worthy information found')
      return NextResponse.json({ 
        hasMemories: false, 
        memories: [] 
      })
    }

    console.log('✅ Memory-worthy information detected')

    // Step 2: Get existing memories
    const { data: existingMemories, error: fetchError } = await supabaseAdmin
      .from('memories')
      .select('content')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching memories:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch existing memories' }, { status: 500 })
    }

    const existingContents = existingMemories?.map(m => m.content) || []

    // Step 3: Extract specific memories
    const extractedMemories = await extractMemories(message, existingContents)
    
    if (extractedMemories.length === 0) {
      console.log('❌ No specific memories extracted')
      return NextResponse.json({ 
        hasMemories: false, 
        memories: [] 
      })
    }

    console.log('🔍 Extracted memories:', extractedMemories)

    // Step 4: Process extracted memories
    const processedMemories = []

    for (const memory of extractedMemories) {
      try {
        if (memory.action === 'create') {
          const { data, error } = await supabaseAdmin
            .from('memories')
            .insert({
              content: memory.content,
              category: memory.category
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating memory:', error)
          } else {
            processedMemories.push(data)
            console.log('✅ Created memory:', memory.content)
          }
        } else if (memory.action === 'update' && memory.oldContent) {
          const { data, error } = await supabaseAdmin
            .from('memories')
            .update({ 
              content: memory.content,
              category: memory.category,
              updated_at: new Date().toISOString()
            })
            .eq('content', memory.oldContent)
            .select()
            .single()

          if (error) {
            console.error('Error updating memory:', error)
          } else {
            processedMemories.push(data)
            console.log('🔄 Updated memory:', memory.oldContent, '->', memory.content)
          }
        } else if (memory.action === 'delete' && memory.oldContent) {
          // Try exact match first
          let { data: deleted, error } = await supabaseAdmin
            .from('memories')
            .delete()
            .eq('content', memory.oldContent)
            .select()

          // If no exact match found, try fuzzy matching
          if (!deleted || deleted.length === 0) {
            console.log('🔍 Exact match not found, trying fuzzy match for:', memory.oldContent)
            
            // Get all memories and find partial matches
            const { data: allMemories } = await supabaseAdmin
              .from('memories')
              .select('*')
            
            const fuzzyMatches = allMemories?.filter(mem => 
              memory.oldContent && (
                mem.content.toLowerCase().includes(memory.oldContent.toLowerCase()) ||
                memory.oldContent.toLowerCase().includes(mem.content.toLowerCase())
              )
            )
            
            if (fuzzyMatches && fuzzyMatches.length > 0) {
              // Delete the first fuzzy match
              const { error: fuzzyError } = await supabaseAdmin
                .from('memories')
                .delete()
                .eq('id', fuzzyMatches[0].id)
              
              if (fuzzyError) {
                console.error('❌ Error deleting fuzzy matched memory:', fuzzyError)
              } else {
                console.log('🗑️ Deleted fuzzy matched memory:', fuzzyMatches[0].content)
              }
            } else {
              console.log('❌ No memory found to delete for:', memory.oldContent)
            }
          } else {
            console.log('🗑️ Deleted exact matched memory:', memory.oldContent)
          }

          if (error) {
            console.error('❌ Error deleting memory:', error)
          }
        }
      } catch (error) {
        console.error('Error processing memory:', error)
      }
    }

    return NextResponse.json({
      hasMemories: true,
      memories: processedMemories,
      extracted: extractedMemories,
      deletedMemories: extractedMemories.filter(m => m.action === 'delete').length
    })

  } catch (error) {
    console.error('Memory extraction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 