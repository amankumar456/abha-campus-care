import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, subject, message, submission_type, sender_role, college_name, branch, year } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ valid: true, notes: "AI validation skipped - no key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a form submission validator for a university health portal contact form. Analyze this submission and determine if it's valid or spam/random/gibberish.

Submission:
- Name: ${name}
- Email: ${email}
- Subject: ${subject || "N/A"}
- Message: ${message}
- Type: ${submission_type}
- Role: ${sender_role}
- College: ${college_name || "N/A"}
- Branch: ${branch || "N/A"}
- Year: ${year || "N/A"}

Rules:
1. Name must look like a real human name (not random characters)
2. Email must look legitimate (not keyboard smash)
3. Message must be coherent and meaningful (not lorem ipsum, random text, or gibberish)
4. If sender_role is "student", branch and year should be plausible
5. If sender_role is "professor", subject/college should be plausible
6. Short but real messages are OK (e.g. "Great project!" is valid)
7. Be lenient - only reject clearly fake/spam submissions`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You validate form submissions. Respond with ONLY a JSON object." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "validate_submission",
            description: "Return validation result",
            parameters: {
              type: "object",
              properties: {
                valid: { type: "boolean", description: "true if submission looks legitimate" },
                reason: { type: "string", description: "Brief explanation" },
              },
              required: ["valid", "reason"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "validate_submission" } },
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ valid: true, notes: "AI validation unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ valid: result.valid, notes: result.reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true, notes: "Could not parse AI response" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Validation error:", e);
    return new Response(JSON.stringify({ valid: true, notes: "Validation error - allowing submission" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
