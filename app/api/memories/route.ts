import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET: Fetch all memories
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memories:', error)
      return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
    }

    return NextResponse.json({ memories: data || [] })
  } catch (error) {
    console.error('Memories API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new memory
export async function POST(request: NextRequest) {
  try {
    const { content, category } = await request.json()

    if (!content || !category) {
      return NextResponse.json({ 
        error: 'Content and category are required' 
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('memories')
      .insert({
        content,
        category
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating memory:', error)
      return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
    }

    return NextResponse.json({ memory: data })
  } catch (error) {
    console.error('Create memory API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update memory
export async function PUT(request: NextRequest) {
  try {
    const { id, content, category } = await request.json()

    if (!id || !content || !category) {
      return NextResponse.json({ 
        error: 'ID, content, and category are required' 
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('memories')
      .update({
        content,
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating memory:', error)
      return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 })
    }

    return NextResponse.json({ memory: data })
  } catch (error) {
    console.error('Update memory API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete memory
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      console.error('❌ Delete memory: No ID provided')
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 })
    }



    const { error, count } = await supabaseAdmin
      .from('memories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting memory from database:', error)
      return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
    }

    console.log('✅ Memory deleted from database, rows affected:', count)
    return NextResponse.json({ success: true, deleted: count })
  } catch (error) {
    console.error('❌ Delete memory API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 