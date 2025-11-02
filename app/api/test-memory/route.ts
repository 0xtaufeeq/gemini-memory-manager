import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('\n🧪 Testing memory-extract endpoint...')
  
  // Test message
  const testMessage = "I love cats"
  
  try {
    // Call the memory extraction API
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/memory-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testMessage })
    })
    
    const data = await response.json()
    
    console.log('✅ Test complete!')
    console.log('Response:', data)
    
    return NextResponse.json({
      success: true,
      testMessage,
      response: data,
      status: response.status
    })
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
