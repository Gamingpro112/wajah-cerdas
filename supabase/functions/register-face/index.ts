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

    const { userId, imageFileNames } = await req.json();

    if (!userId || !imageFileNames || !Array.isArray(imageFileNames)) {
      return new Response(
        JSON.stringify({ error: "Missing userId or imageFileNames" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing face registration for user ${userId} with ${imageFileNames.length} images`);

    // Download and process images
    const imageProcessingPromises = imageFileNames.map(async (fileName) => {
      const { data: imageData, error: downloadError } = await supabase.storage
        .from("face-images")
        .download(fileName);

      if (downloadError) {
        console.error(`Error downloading image ${fileName}:`, downloadError);
        throw downloadError;
      }

      // Convert blob to base64
      const arrayBuffer = await imageData.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      return { fileName, base64Image };
    });

    const processedImages = await Promise.all(imageProcessingPromises);
    console.log(`Successfully processed ${processedImages.length} images`);

    // In a production environment, this is where you would:
    // 1. Use YuNet to detect faces in each image
    // 2. Use SFace to generate face embeddings
    // 3. Store the embeddings in the embeddings table
    
    // For now, we'll create placeholder embeddings
    // In production, replace this with actual face recognition model processing
    const embeddingVector = Array(128).fill(0).map(() => Math.random().toString());

    // Store embeddings
    const { error: embeddingError } = await supabase
      .from("embeddings")
      .insert({
        user_id: userId,
        vector: embeddingVector.join(","),
      });

    if (embeddingError) {
      console.error("Error storing embeddings:", embeddingError);
      throw embeddingError;
    }

    // Store image references
    const imageInserts = imageFileNames.map((fileName) => ({
      user_id: userId,
      image_url: fileName,
      embedding_id: userId, // Link to embeddings
    }));

    const { error: imageError } = await supabase
      .from("user_images")
      .insert(imageInserts);

    if (imageError) {
      console.error("Error storing image references:", imageError);
      throw imageError;
    }

    console.log(`Face registration completed successfully for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Face registered successfully",
        embeddingsCount: 1,
        imagesCount: imageFileNames.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in register-face:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
