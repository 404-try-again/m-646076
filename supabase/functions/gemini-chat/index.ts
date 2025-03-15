
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is set
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Safely parse request JSON
    let requestData;
    try {
      requestData = await req.json();
    } catch (err) {
      return new Response(JSON.stringify({ 
        error: "Invalid JSON format" 
      }), {
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      });
    }
    
    const { prompt, history = [] } = requestData;
    
    console.log("Received request with prompt:", prompt);
    console.log("Chat history length:", history.length);

    // Format conversation history for Gemini API
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add the current prompt
    const messages = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    // Make request to Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();
    console.log("Received response from Gemini API");

    // Extract response text with safe checks
    let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from the AI.";
    
    if (data.error) {
      console.error("Gemini API error:", data.error);
      throw new Error(data.error.message || "Error from Gemini API");
    }

    return new Response(JSON.stringify({ 
      response: responseText 
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unknown error occurred" 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  }
});
