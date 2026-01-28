// Supabase Edge Function - Face Verification with DeepFace
// Compare verification photos with profile photo to prevent catfishing

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// DeepFace server configuration
const DEEPFACE_SERVER_URL = Deno.env.get('DEEPFACE_SERVER_URL') || 'http://localhost:8000';
const DEEPFACE_API_SECRET = Deno.env.get('DEEPFACE_API_SECRET') || 'shy-verification-secret-change-me';

// Supabase configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface VerifyFaceRequest {
  profilePhotoUrl: string;
  verificationPhotoUrls: string[];
  userId: string;
}

interface DeepFaceResponse {
  verified: boolean;
  confidence: number;
  matched_photos: number;
  total_photos: number;
  details: Array<{
    photo_index: number;
    matched: boolean;
    distance: number;
    similarity_percent: number;
    error?: string;
  }>;
  error?: string;
}

interface VerifyFaceResponse {
  verified: boolean;
  confidence: number;
  matchedPhotos: number;
  totalPhotos: number;
  details: Array<{
    photoIndex: number;
    matched: boolean;
    similarity: number;
    error?: string;
  }>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Parse request
    const { profilePhotoUrl, verificationPhotoUrls, userId }: VerifyFaceRequest = await req.json();

    if (!profilePhotoUrl || !verificationPhotoUrls || verificationPhotoUrls.length === 0) {
      throw new Error('Missing required parameters');
    }

    console.log(`[verify-face] Starting verification for user ${userId}`);
    console.log(`[verify-face] Profile photo: ${profilePhotoUrl}`);
    console.log(`[verify-face] Verification photos: ${verificationPhotoUrls.length}`);
    console.log(`[verify-face] DeepFace server: ${DEEPFACE_SERVER_URL}`);

    // Call DeepFace server
    const deepfaceResponse = await fetch(`${DEEPFACE_SERVER_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_photo_url: profilePhotoUrl,
        verification_photo_urls: verificationPhotoUrls,
        user_id: userId,
        api_secret: DEEPFACE_API_SECRET,
      }),
    });

    if (!deepfaceResponse.ok) {
      const errorText = await deepfaceResponse.text();
      console.error(`[verify-face] DeepFace server error: ${deepfaceResponse.status} - ${errorText}`);
      throw new Error(`DeepFace server error: ${deepfaceResponse.status}`);
    }

    const result: DeepFaceResponse = await deepfaceResponse.json();
    console.log(`[verify-face] DeepFace result:`, result);

    // Update user's verification status in the database if verified
    if (result.verified) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log(`[verify-face] User ${userId} verified successfully`);
    }

    // Transform response to match expected format
    const response: VerifyFaceResponse = {
      verified: result.verified,
      confidence: result.confidence,
      matchedPhotos: result.matched_photos,
      totalPhotos: result.total_photos,
      details: result.details.map(d => ({
        photoIndex: d.photo_index,
        matched: d.matched,
        similarity: d.similarity_percent,
        error: d.error,
      })),
      error: result.error,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[verify-face] Error:', error);

    const response: VerifyFaceResponse = {
      verified: false,
      confidence: 0,
      matchedPhotos: 0,
      totalPhotos: 0,
      details: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
