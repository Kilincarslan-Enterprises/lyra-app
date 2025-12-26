import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const N8N_WEBHOOK_URL = "https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/lyra";
const WEBHOOK_AUTH_TOKEN = Deno.env.get("WEBHOOK_AUTH_TOKEN");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!WEBHOOK_AUTH_TOKEN) {
      console.error("WEBHOOK_AUTH_TOKEN is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          response: "Service configuration error. Please contact support.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "WEBHOOK_AUTH_TOKEN": WEBHOOK_AUTH_TOKEN,
      },
      body: JSON.stringify({
        message,
        userId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook failed:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          response: "Failed to process your message. Please try again.",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const n8nData = await n8nResponse.json();
    return new Response(
      JSON.stringify({
        success: true,
        response: n8nData.response || "Message received and processed",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in lyra-chat function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});