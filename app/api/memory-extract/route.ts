import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const model = google('gemini-2.0-flash-exp')

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
  const sentinelPrompt = `Analyze this message and determine if it contains personal information worth remembering.

Look for ANY of these:
1. Food preferences: likes, dislikes, allergies (e.g. "I love pizza", "allergic to nuts", "hate spicy food")
2. Personal attributes: location, family, lifestyle, diet (e.g. "live in NYC", "vegetarian", "have kids")
3. Interests/hobbies: what they enjoy (e.g. "love gaming", "enjoy hiking")
4. Technology preferences: devices, brands, tools (e.g. "love Samsung", "use iPhone", "prefer Windows")
5. Work/professional details (e.g. "I'm a developer", "work from home")
6. Any other personal preference or characteristic
7. Memory management: remember/forget/delete/update requests

Message: "${message}"

Examples:
"I love Samsung devices" → TRUE
"I'm vegetarian" → TRUE
"What's the weather?" → FALSE
"I hate spicy food" → TRUE
"remember I like cats" → TRUE
"I live in New York" → TRUE
"Tell me a joke" → FALSE

Respond with exactly one word: TRUE or FALSE`

  try {
    const result = await generateText({
      model,
      prompt: sentinelPrompt,
      temperature: 0
    })
    
    console.log('🤖 Sentinel response:', result.text)
    const responseText = result.text.trim().toUpperCase()
    
    // Check for various affirmative responses
    const isTrue = responseText.includes('TRUE') || 
                   responseText === 'YES' || 
                   responseText.startsWith('TRUE') ||
                   responseText.startsWith('YES')
    
    console.log('🎯 Sentinel decision:', isTrue ? '✅ MEMORY-WORTHY' : '❌ NOT MEMORY-WORTHY')
    return isTrue
  } catch (error) {
    console.error('❌ Sentinel error:', error)
    return false
  }
}

// Knowledge Master: Extract specific memories from message
async function extractMemories(message: string, existingMemories: string[]): Promise<ExtractedMemory[]> {
  const extractionPrompt = `Extract personal information worth remembering from this message.

CATEGORIES:
- "allergy": Food allergies (ONLY if explicitly stated as allergy)
- "like": Things the person enjoys (food, tech, activities, brands, animals, colors, etc.)
- "dislike": Things the person dislikes
- "attribute": Personal characteristics (location, family, job, diet, etc.)

ACTIONS:
- "create": New information to store
- "update": Modify existing information
- "delete": Remove specific memory

EXISTING MEMORIES:
${existingMemories.length > 0 ? existingMemories.map((mem, i) => `${i + 1}. ${mem}`).join('\n') : 'None'}

MESSAGE: "${message}"

EXAMPLES:
Input: "I love cats"
Output: [{"content": "loves cats", "category": "like", "action": "create"}]

Input: "I'm allergic to peanuts"
Output: [{"content": "allergic to peanuts", "category": "allergy", "action": "create"}]

Input: "I live in New York"
Output: [{"content": "lives in New York", "category": "attribute", "action": "create"}]

Input: "I hate spicy food"
Output: [{"content": "dislikes spicy food", "category": "dislike", "action": "create"}]

Input: "My favorite color is blue"
Output: [{"content": "favorite color is blue", "category": "like", "action": "create"}]

Input: "forget that I like cats" (when "loves cats" exists)
Output: [{"content": "", "category": "like", "action": "delete", "oldContent": "loves cats"}]

RULES:
1. Use third person (e.g., "loves cats" not "I love cats")
2. Be concise and clear
3. Only extract definitive statements
4. For deletion, match the oldContent to existing memories
5. Return empty array [] if no memories found

Respond with ONLY a valid JSON array. No explanations, no markdown, just the JSON.`

  try {
    const result = await generateText({
      model,
      prompt: extractionPrompt,
      temperature: 0
    })
    
    console.log('🧠 Knowledge Master RAW response:', result.text)
    
    // Clean the response - remove markdown code blocks if present
    let cleanJson = result.text.trim()
    cleanJson = cleanJson.replace(/^```json\s*/i, '')
    cleanJson = cleanJson.replace(/^```\s*/i, '')
    cleanJson = cleanJson.replace(/\s*```$/i, '')
    cleanJson = cleanJson.trim()
    
    console.log('🧹 Cleaned JSON:', cleanJson)
    
    // Parse JSON
    const parsed = JSON.parse(cleanJson) as ExtractedMemory[]
    console.log('✅ Successfully parsed memories:', parsed.length)
    
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('❌ Memory extraction error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return []
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('\n' + '='.repeat(80))
  console.log('🚀 MEMORY EXTRACTION STARTED')
  console.log('='.repeat(80))
  
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
      console.error('❌ No message provided')
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log('📝 Message received:', message)
    console.log('📏 Message length:', message.length, 'characters')

    console.log('📝 Message received:', message)
    console.log('📏 Message length:', message.length, 'characters')

    // Step 1: Check if message contains memory-worthy information
    console.log('\n--- STEP 1: Sentinel Check ---')
    const sentinelStart = Date.now()
    const isWorthy = await isMemoryWorthy(message)
    console.log(`⏱️  Sentinel took ${Date.now() - sentinelStart}ms`)
    
    if (!isWorthy) {
      console.log('❌ No memory-worthy information found')
      console.log('='.repeat(80))
      console.log(`⏱️  Total time: ${Date.now() - startTime}ms`)
      console.log('='.repeat(80) + '\n')
      return NextResponse.json({ 
        hasMemories: false, 
        memories: [] 
      })
    }

    console.log('✅ Memory-worthy information detected')

    // Step 2: Get existing memories
    console.log('\n--- STEP 2: Fetch Existing Memories ---')
    const fetchStart = Date.now()
    const { data: existingMemories, error: fetchError } = await supabaseAdmin
      .from('memories')
      .select('content')
      .order('created_at', { ascending: false })

    console.log(`⏱️  Database fetch took ${Date.now() - fetchStart}ms`)

    if (fetchError) {
      console.error('❌ Error fetching memories:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch existing memories' }, { status: 500 })
    }

    const existingContents = existingMemories?.map(m => m.content) || []
    console.log('📚 Existing memories count:', existingContents.length)
    if (existingContents.length > 0) {
      console.log('📚 Existing memories:', existingContents)
    }

    // Step 3: Extract specific memories
    console.log('\n--- STEP 3: Extract Memories ---')
    const extractStart = Date.now()
    const extractedMemories = await extractMemories(message, existingContents)
    console.log(`⏱️  Extraction took ${Date.now() - extractStart}ms`)
    
    if (extractedMemories.length === 0) {
      console.log('❌ No specific memories extracted')
      console.log('='.repeat(80))
      console.log(`⏱️  Total time: ${Date.now() - startTime}ms`)
      console.log('='.repeat(80) + '\n')
      return NextResponse.json({ 
        hasMemories: false, 
        memories: [] 
      })
    }

    console.log('🔍 Extracted memories:', extractedMemories.length)
    extractedMemories.forEach((mem, i) => {
      console.log(`  ${i + 1}. [${mem.action}] ${mem.content || mem.oldContent} (${mem.category})`)
    })

    // Step 4: Process extracted memories
    console.log('\n--- STEP 4: Process Memories ---')
    const processStart = Date.now()
    const processedMemories = []

    for (const memory of extractedMemories) {
      try {
        if (memory.action === 'create') {
          console.log(`➕ Creating memory: "${memory.content}" [${memory.category}]`)
          const { data, error } = await supabaseAdmin
            .from('memories')
            .insert({
              content: memory.content,
              category: memory.category
            })
            .select()
            .single()

          if (error) {
            console.error('❌ Error creating memory:', error)
          } else {
            processedMemories.push(data)
            console.log('✅ Created memory:', memory.content)
          }
        } else if (memory.action === 'update' && memory.oldContent) {
          console.log(`🔄 Updating memory: "${memory.oldContent}" → "${memory.content}"`)
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
            console.error('❌ Error updating memory:', error)
          } else {
            processedMemories.push(data)
            console.log('✅ Updated memory:', memory.oldContent, '->', memory.content)
          }
        } else if (memory.action === 'delete' && memory.oldContent) {
          console.log(`🗑️  Attempting to delete memory: "${memory.oldContent}"`)
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
              console.log(`🎯 Found ${fuzzyMatches.length} fuzzy matches:`, fuzzyMatches.map(m => m.content))
              // Delete the first fuzzy match
              const { error: fuzzyError } = await supabaseAdmin
                .from('memories')
                .delete()
                .eq('id', fuzzyMatches[0].id)
              
              if (fuzzyError) {
                console.error('❌ Error deleting fuzzy matched memory:', fuzzyError)
              } else {
                console.log('✅ Deleted fuzzy matched memory:', fuzzyMatches[0].content)
              }
            } else {
              console.log('❌ No memory found to delete for:', memory.oldContent)
            }
          } else {
            console.log('✅ Deleted exact matched memory:', memory.oldContent)
          }

          if (error) {
            console.error('❌ Error deleting memory:', error)
          }
        }
      } catch (error) {
        console.error('❌ Error processing memory:', error)
      }
    }

    console.log(`⏱️  Processing took ${Date.now() - processStart}ms`)
    console.log(`✅ Successfully processed ${processedMemories.length} memories`)
    
    console.log('\n' + '='.repeat(80))
    console.log(`⏱️  TOTAL TIME: ${Date.now() - startTime}ms`)
    console.log('='.repeat(80) + '\n')

    return NextResponse.json({
      hasMemories: true,
      memories: processedMemories,
      extracted: extractedMemories,
      deletedMemories: extractedMemories.filter(m => m.action === 'delete').length
    })

  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ MEMORY EXTRACTION FAILED')
    console.error('='.repeat(80))
    console.error('Memory extraction API error:', error)
    console.error('='.repeat(80) + '\n')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 