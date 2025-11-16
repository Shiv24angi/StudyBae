import { NextRequest, NextResponse } from 'next/server'

// NOTE: In a real environment, you would use a dedicated function 
// to call the LLM API (like the Gemini API) instead of 'http://localhost:11434'.
// The logic below is adapted for the standard pattern required by this environment 
// (which assumes global LLM API access).

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json()

    if (!notes) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      )
    }

    // --- LLM API Configuration (Adapted for the environment's requirements) ---
    const userQuery = `Create 5-8 flashcards in JSON format from the following notes. Use the exact structure: 
      { "flashcards": [ { "front": "Question or term", "back": "Answer or definition" } ] }. 
      Notes: ${notes}`;
      
    const systemPrompt = "You are an expert educational assistant. Your sole purpose is to convert raw notes into a concise, valid JSON array of flashcards. Do not include any text outside the JSON object.";
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "flashcards": {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "front": { "type": "STRING" },
                                "back": { "type": "STRING" }
                            },
                            "propertyOrdering": ["front", "back"]
                        }
                    }
                }
            }
        }
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
    
    // The structured response is in a string inside data.candidates[0].content.parts[0].text
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (jsonText) {
      try {
        const flashcardsData = JSON.parse(jsonText);
        return NextResponse.json(flashcardsData);
      } catch (parseError) {
        console.error('Failed to parse structured JSON response:', parseError);
        return NextResponse.json(
          { error: 'LLM returned invalid JSON structure' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'No content returned from LLM' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Flashcards API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards due to internal server error.' },
      { status: 500 }
    );
  }
}