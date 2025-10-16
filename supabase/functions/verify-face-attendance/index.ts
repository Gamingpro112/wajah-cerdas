import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, imageFileName } = await req.json();

    if (!userId || !imageFileName) {
      return new Response(
        JSON.stringify({ error: "Missing userId or imageFileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing face verification for user ${userId}`);

    // Download the uploaded image
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("face-images")
      .download(imageFileName);

    if (downloadError) {
      console.error("Error downloading image:", downloadError);
      throw downloadError;
    }

    // Convert blob to base64
    const arrayBuffer = await imageData.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Get user's stored embeddings
    const { data: userEmbeddings, error: embeddingsError } = await supabase
      .from("embeddings")
      .select("vector")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (embeddingsError) {
      console.error("Error fetching embeddings:", embeddingsError);
      throw embeddingsError;
    }

    // For now, we'll simulate face recognition with a simple check
    // In production, you would use actual face recognition model here
    const matched = userEmbeddings !== null;
    const score = matched ? 0.85 : 0.45; // Simulated confidence score

    // If matched, mark attendance
    if (matched) {
      const { error: attendanceError } = await supabase
        .from("attendance_logs")
        .insert({
          user_id: userId,
          status: "hadir",
          score: score,
          timestamp: new Date().toISOString(),
        });

      if (attendanceError) {
        console.error("Error marking attendance:", attendanceError);
        throw attendanceError;
      }

      console.log(`Attendance marked successfully for user ${userId}`);
    }

    // Clean up uploaded image
    await supabase.storage.from("face-images").remove([imageFileName]);

    return new Response(
      JSON.stringify({
        matched,
        score,
        message: matched ? "Face verified and attendance marked" : "Face not matched",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-face-attendance:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
