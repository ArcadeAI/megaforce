// Next.js API proxy to avoid CORS issues with Heroku backend
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return proxyRequest(request, resolvedParams.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return proxyRequest(request, resolvedParams.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  try {
    const url = `${BACKEND_URL}/${path.join('/')}`
    const searchParams = request.nextUrl.searchParams.toString()
    const fullUrl = searchParams ? `${url}?${searchParams}` : url

    // Get request body for POST/PUT requests
    let body: string | undefined
    if (method === 'POST' || method === 'PUT') {
      body = await request.text()
    }

    // Forward headers (especially Authorization)
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      // Forward important headers but skip host-specific ones
      if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
        headers[key] = value
      }
    })

    console.log(`🔄 Proxying ${method} ${fullUrl}`)

    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    })

    const responseText = await response.text()
    
    // Try to parse as JSON, fall back to text
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    console.log(`📥 Proxy response: ${response.status} ${response.statusText}`)
    if (!response.ok) {
      console.error(`❌ Backend error response for ${path.join('/')}:`, responseData)
      console.error(`❌ Request details:`, {
        method,
        url: fullUrl,
        headers: Object.keys(headers),
        bodyLength: body?.length || 0
      })
    }

    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    })

  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
