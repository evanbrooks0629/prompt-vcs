import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'LLM API route is working' })
}

export async function POST(request: NextRequest) {
  console.log('LLM API route called')
  try {
    const { provider, model, messages, temperature, maxTokens, topP, apiKey } = await request.json()
    console.log('Request data:', { provider, model, temperature, maxTokens, topP, hasApiKey: !!apiKey })

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    let response
    let data

    if (provider === 'openai') {
      // OpenAI API call
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return NextResponse.json(
          { error: error.error?.message || 'OpenAI API request failed' },
          { status: response.status }
        )
      }

      data = await response.json()
      return NextResponse.json({
        content: data.choices[0]?.message?.content || 'No response generated'
      })
    } else if (provider === 'anthropic') {
      // Anthropic API call
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.min(8192, maxTokens),
          temperature,
          messages
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return NextResponse.json(
          { error: error.error?.message || 'Anthropic API request failed' },
          { status: response.status }
        )
      }

      data = await response.json()
      return NextResponse.json({
        content: data.content[0]?.text || 'No response generated'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid provider specified' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('LLM API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 