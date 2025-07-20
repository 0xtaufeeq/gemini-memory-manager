import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET: Fetch all chat sessions
export async function GET() {
  try {
    console.log('📚 Fetching all chat sessions from database')
    
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching chat sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 })
    }

    console.log('📚 Found chat sessions:', data?.length || 0)
    return NextResponse.json({ sessions: data || [] })
  } catch (error) {
    console.error('❌ Chat sessions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new chat session
export async function POST(request: NextRequest) {
  try {
    const { title, messages } = await request.json()

    if (!title) {
      return NextResponse.json({ 
        error: 'Title is required' 
      }, { status: 400 })
    }

    console.log('📝 Creating new chat session:', title)

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        title,
        messages: messages || []
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating chat session:', error)
      return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 })
    }

    console.log('✅ Created chat session:', data.id)
    return NextResponse.json({ session: data })
  } catch (error) {
    console.error('❌ Create chat session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update chat session
export async function PUT(request: NextRequest) {
  try {
    const { id, title, messages } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 })
    }

    console.log('🔄 Updating chat session:', id)

    const updateData: any = { updated_at: new Date().toISOString() }
    if (title) updateData.title = title
    if (messages) updateData.messages = messages

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating chat session:', error)
      return NextResponse.json({ error: 'Failed to update chat session' }, { status: 500 })
    }

    console.log('✅ Updated chat session:', id)
    return NextResponse.json({ session: data })
  } catch (error) {
    console.error('❌ Update chat session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete chat session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      console.error('❌ Delete chat session: No ID provided')
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }



    const { error, count } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting chat session from database:', error)
      return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 })
    }

    console.log('✅ Chat session deleted from database, rows affected:', count)
    return NextResponse.json({ success: true, deleted: count })
  } catch (error) {
    console.error('❌ Delete chat session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 