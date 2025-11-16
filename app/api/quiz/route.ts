import { NextRequest, NextResponse } from 'next/server'

// This API route generates a multiple-choice quiz from input text using the Gemini API.

export async function POST(req: NextRequest) {
  try {
    // 1. Change input variable name from 'notes' to 'text'
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required to generate a quiz' },
        { status: 400 }
      )
    }

    // --- LLM API Configuration ---
    // 2. Update user query to reflect the quiz generation task (4-6 questions, multiple choice)
    const userQuery = `Create 4-6 multiple choice questions from the following text. Generate them in JSON format with the following exact structure. The 'correct' field must be the 0-based index of the correct option (0 to 3). Make questions challenging but fair.
{
  "quiz": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}
Text: ${text}`;
      
    const systemPrompt = "You are an expert quiz master. Your sole purpose is to convert raw text into a concise, valid JSON array of multiple choice quiz questions. Do not include any text outside the JSON object.";
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            // 3. Define the response schema for the quiz structure
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "quiz": {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "question": { "type": "STRING" },
                                "options": { "type": "ARRAY", "items": { "type": "STRING" } },
                                "correct": { "type": "INTEGER" }, // Index of the correct option
                                "explanation": { "type": "STRING" }
                            },
                            "propertyOrdering": ["question", "options", "correct", "explanation"]
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
        // 4. Parse the structured JSON response
        const quizData = JSON.parse(jsonText);
        // Ensure the top-level property is 'quiz' as expected
        if (quizData.quiz) {
            return NextResponse.json(quizData);
        } else {
            throw new Error("Parsed JSON missing 'quiz' property.");
        }
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
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz due to internal server error.' },
      { status: 500 }
    );
  }
}