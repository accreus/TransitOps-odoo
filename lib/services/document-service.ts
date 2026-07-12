import { createAdminClient } from "@/lib/supabase/admin";
import { mapRowsToCamelCase, mapToSnakeCase } from "@/lib/db-mapper";
import type { ServiceResult } from "@/lib/types";

const supabase = createAdminClient();
const STORAGE_BUCKET = "documents";

export interface DocumentRecord {
  id: string;
  referenceType: string;
  referenceId: string;
  filePath: string;
  documentType: string;
  createdAt: string;
}

export interface DocumentWithUrl extends DocumentRecord {
  signedUrl?: string;
}

async function createSignedUrl(filePath: string): Promise<string | undefined> {
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour
  return data?.signedUrl;
}

export async function getDocuments(
  referenceType: string,
  referenceId: string,
): Promise<ServiceResult<DocumentWithUrl[]>> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  const docs = await Promise.all(
    (data ?? []).map(async (doc) => {
      const mapped = mapRowsToCamelCase<DocumentRecord>([doc])[0];
      const signedUrl = await createSignedUrl(doc.file_path);
      return { ...mapped, signedUrl };
    }),
  );

  return { success: true, data: docs };
}

export async function uploadDocument(params: {
  referenceType: string;
  referenceId: string;
  documentType: string;
  fileBuffer: ArrayBuffer;
  fileName: string;
  contentType: string;
}): Promise<ServiceResult<DocumentRecord>> {
  const { referenceType, referenceId, documentType, fileBuffer, fileName, contentType } = params;

  const timestamp = Date.now();
  const fileExt = fileName.split(".").pop();
  const filePath = `${referenceType}/${referenceId}/${timestamp}_${documentType}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileBuffer, { contentType });

  if (uploadError) return { success: false, error: `Storage upload failed: ${uploadError.message}` };

  // Create DB record
  const dbRow = mapToSnakeCase({
    referenceType,
    referenceId,
    filePath,
    documentType,
  } as Record<string, unknown>);

  const { data, error: dbError } = await supabase
    .from("documents")
    .insert(dbRow)
    .select()
    .single();

  if (dbError) {
    // Rollback storage
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    return { success: false, error: dbError.message };
  }

  return { success: true, data: mapRowsToCamelCase<DocumentRecord>([data])[0] };
}

export async function deleteDocument(id: string): Promise<ServiceResult<void>> {
  // Get file path first
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError || !doc) return { success: false, error: "Document not found" };

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([doc.file_path]);

  if (storageError) {
    console.warn("Failed to delete file from storage:", storageError.message);
  }

  // Delete from DB
  const { error: dbError } = await supabase.from("documents").delete().eq("id", id);
  if (dbError) return { success: false, error: dbError.message };

  return { success: true, data: undefined };
}

export async function getDocumentById(id: string): Promise<ServiceResult<DocumentWithUrl>> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: "Document not found" };

  const mapped = mapRowsToCamelCase<DocumentRecord>([data])[0];
  const signedUrl = await createSignedUrl(data.file_path);
  return { success: true, data: { ...mapped, signedUrl } };
}
