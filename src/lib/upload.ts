import { supabase } from "@/integrations/supabase/client";

export type Bucket = "pet-photos" | "post-media" | "place-photos" | "service-photos" | "community-media";

/**
 * Uploads a file (image or video) to a private bucket under a user-scoped folder
 * and returns a long-lived signed URL safe to store in the database.
 */
export async function uploadImage(bucket: Bucket, file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Faça login para enviar arquivos");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (error || !data) throw error ?? new Error("Falha ao gerar URL");
  return data.signedUrl;
}

export const uploadMedia = uploadImage;
