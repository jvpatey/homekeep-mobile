import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Delete all user data in the correct order
    console.log(`Deleting data for user: ${userId}`);

    // 1. Delete notification schedules
    await supabaseAdmin
      .from("notification_schedules")
      .delete()
      .eq("user_id", userId);

    // 2. Delete notification preferences
    await supabaseAdmin
      .from("notification_preferences")
      .delete()
      .eq("user_id", userId);

    // 3. Delete push notifications
    await supabaseAdmin
      .from("push_notifications")
      .delete()
      .eq("user_id", userId);

    // 4. Get routine IDs first, then delete instances
    const { data: routineIds } = await supabaseAdmin
      .from("maintenance_routines")
      .select("id")
      .eq("user_id", userId);

    if (routineIds && routineIds.length > 0) {
      // Delete routine instances
      await supabaseAdmin
        .from("routine_instances")
        .delete()
        .in(
          "routine_id",
          routineIds.map((r) => r.id)
        );
    }

    // 5. Delete maintenance routines
    await supabaseAdmin
      .from("maintenance_routines")
      .delete()
      .eq("user_id", userId);

    // 6. Delete user profile
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 7. Delete the auth user completely
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully deleted user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-user function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
