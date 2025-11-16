import { NextRequest, NextResponse } from 'next/server'

// This API route acts as a Study Buddy, answering questions using the Gemini API.

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // --- LLM API Configuration ---
    const userQuery = `Question: ${question}`;
      
    // Maintain the friendly and supportive persona requested by the user
    const systemPrompt = "You are a helpful, world-class study buddy AI. Answer the following question in a clear, educational way. Provide detailed explanations, helpful examples, and encourage the user's learning. Maintain a friendly and supportive tone. Format the response using Markdown for readability (headings, lists, bolding).";
    
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    // --- End LLM API Configuration ---

    // Using exponential backoff for the API call
    const MAX_RETRIES = 3;
    let response;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          break; // Success
        } else if (response.status === 429 && i < MAX_RETRIES - 1) {
          // Retry on Rate Limit
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        } else {
          // Non-retryable error
          throw new Error(`API call failed with status ${response.status}`);
        }
      } catch (e) {
        if (i === MAX_RETRIES - 1) throw e;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    if (!response || !response.ok) {
      throw new Error('Failed to get response from LLM API after retries');
    }

    const data = await response.json();
    
    const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (answerText) {
      return NextResponse.json({ answer: answerText });
    }

    return NextResponse.json(
      { error: 'No content returned from Study Buddy' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Study Buddy API error:', error);
    return NextResponse.json(
      { error: 'Failed to get study buddy response due to internal server error.' },
      { status: 500 }
    );
  }
}