import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticateUser, getSupabaseClient } from "../_shared/auth.ts";

const PROFILE_FIELDS = [
  "full_name",
  "full_name_english",
  "personal_phone",
  "personal_id",
  "personal_address_1_id",
  "personal_address_2_id",
  "company",
  "company_logo",
  "department",
  "job_title",
  "work_phone",
  "work_email",
  "website",
  "tax_id_main",
  "tax_id_branch",
  "work_address_1_id",
  "work_address_2_id",
  "facebook",
  "line_id",
  "linkedin",
  "twitter",
  "instagram",
  "tiktok",
  "youtube",
  "telegram",
  "whatsapp",
  "wechat",
  "snapchat",
  "pinterest",
  "reddit",
  "discord",
  "slack",
  "viber",
  "skype",
  "zoom",
  "github",
  "twitch",
  "avatar_url",
  "profile_image",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { user, error: authError } = await authenticateUser(req);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError || "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { userId, updates } = body as {
      userId?: string;
      updates?: Record<string, unknown>;
    };

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!updates || typeof updates !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid updates payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Only allow users to update their own profile (admins can be added later if needed)
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden", details: "Cannot update other users" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Remove large fields from metadata payload (not stored in auth metadata)
    const metadataUpdates = { ...updates };
    delete (metadataUpdates as Record<string, unknown>).avatar_url;
    delete (metadataUpdates as Record<string, unknown>).profile_image;

    const payloadSize = JSON.stringify(metadataUpdates).length;
    if (payloadSize > 15000) {
      return new Response(
        JSON.stringify({
          error: "Payload too large",
          message: `User metadata size (${payloadSize} bytes) exceeds limit (~16KB)`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Accept all fields from updates (allow any field to be updated)
    // Filter out null/undefined values and address objects (they are stored in addresses table, not profiles table)
    const profileUpdates: Record<string, unknown> = {};
    const addressObjectFields = ['personal_address_1', 'personal_address_2', 'work_address_1', 'work_address_2'];
    const addressIdFields = ['personal_address_1_id', 'personal_address_2_id', 'work_address_1_id', 'work_address_2_id'];
    
    for (const [key, value] of Object.entries(updates)) {
      // Skip address objects (they are stored in addresses table, not profiles table)
      // Only accept address_id fields (personal_address_1_id, work_address_1_id, etc.)
      if (addressObjectFields.includes(key)) {
        console.log(`Skipping address object field: ${key} (stored in addresses table)`);
        continue;
      }
      
      // Allow null values for address_id fields (to allow clearing references)
      if (addressIdFields.includes(key)) {
        profileUpdates[key] = value; // Allow null to clear reference
        continue;
      }
      
      // Skip null/undefined values for other fields
      if (value === null || value === undefined) {
        continue;
      }
      
      // Skip if value is an object (except for specific allowed fields like role_permissions)
      if (typeof value === 'object' && !Array.isArray(value) && key !== 'role_permissions') {
        console.log(`Skipping object field: ${key} (not a database column)`);
        continue;
      }
      
      profileUpdates[key] = value;
    }

    if (Object.keys(profileUpdates).length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No changes applied" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    try {
      const supabase = getSupabaseClient();

      console.log("Updating profiles table with:", {
        userId,
        fields: Object.keys(profileUpdates),
        fieldCount: Object.keys(profileUpdates).length,
        sampleValues: Object.fromEntries(
          Object.entries(profileUpdates).slice(0, 3)
        ),
      });

      // Update profiles table (without select to avoid RLS issues)
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profiles table:", {
          error: profileError,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          userId,
          fields: Object.keys(profileUpdates),
        });
        return new Response(
          JSON.stringify({
            error: "Failed to update profile",
            details: profileError.message,
            hint: profileError.hint,
            code: profileError.code,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.log("Profile updated successfully:", {
        userId,
        updatedFields: Object.keys(profileUpdates),
      });

      return new Response(
        JSON.stringify({ success: true, error: null }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (dbError) {
      console.error("Database operation error:", {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
      });
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Update profile error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: errorMessage,
        stack: errorStack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
