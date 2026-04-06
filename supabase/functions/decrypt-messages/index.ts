import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decryption using Web Crypto API
async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // Hash the key to ensure it's always 32 bytes for AES-256
    const keyData = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const keyBytes = new Uint8Array(hashBuffer);
    
    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // Decode the combined IV + ciphertext
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    // Decrypt
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );
    
    return decoder.decode(plaintextBytes);
  } catch (error) {
    // If decryption fails, the message might be unencrypted (legacy)
    console.log("Decryption failed, returning original text (likely unencrypted legacy message)");
    return encryptedBase64;
  }
}

// Helper to check if text looks like encrypted base64
function looksEncrypted(text: string): boolean {
  // Encrypted messages should be valid base64 and at least 16 chars (12 IV + some ciphertext)
  if (text.length < 20) return false;
  try {
    const decoded = atob(text);
    // If it decodes and looks like binary data, it's probably encrypted
    return decoded.length >= 12;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ENCRYPTION_KEY = Deno.env.get("MESSAGE_ENCRYPTION_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!ENCRYPTION_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("Missing required environment variables");
      throw new Error("Missing required environment variables");
    }

    // Validate user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's JWT to validate the token
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    });
    
    // Validate the JWT by getting the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create service role client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional source filter from request body
    let sourceFilter: string | undefined;
    try {
      const body = await req.json();
      sourceFilter = body?.source;
    } catch {
      // No body or invalid JSON - that's fine, no filter
    }

    console.log(`Fetching and decrypting messages for user ${user.id}${sourceFilter ? ` (source=${sourceFilter})` : ''}`);

    // Fetch user's messages using admin client
    let query = supabaseAdmin
      .from("messages")
      .select("*")
      .eq("user_id", user.id);
    
    if (sourceFilter) {
      query = query.eq("source", sourceFilter);
    }
    
    const { data: messages, error: fetchError } = await query
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching messages:", fetchError);
      throw fetchError;
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ messages: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt each message
    const decryptedMessages = await Promise.all(
      messages.map(async (message) => {
        // Check if message looks encrypted
        if (looksEncrypted(message.text)) {
          const decryptedText = await decryptText(message.text, ENCRYPTION_KEY);
          return { ...message, text: decryptedText };
        }
        // Return unencrypted message as-is (legacy messages)
        return message;
      })
    );

    console.log(`Decrypted ${messages.length} messages`);

    return new Response(
      JSON.stringify({ messages: decryptedMessages }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Decrypt messages error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
