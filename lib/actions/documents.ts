"use server";

import { requireAuth } from "@/lib/auth-helpers";
import * as documentService from "@/lib/services/document-service";

export async function getDocuments(referenceType: string, referenceId: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return documentService.getDocuments(referenceType, referenceId);
}

export async function getDocumentById(id: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return documentService.getDocumentById(id);
}

export async function deleteDocument(id: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return documentService.deleteDocument(id);
}

/**
 * Upload a document. Called from a Server Action that receives the file as a FormData.
 * Note: file upload from Server Actions uses FormData, not raw ArrayBuffer.
 */
export async function uploadDocument(formData: FormData) {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const file = formData.get("file") as File | null;
  const referenceType = formData.get("referenceType") as string;
  const referenceId = formData.get("referenceId") as string;
  const documentType = formData.get("documentType") as string;

  if (!file || !referenceType || !referenceId || !documentType) {
    return { success: false, error: "Missing required fields" } as const;
  }

  const buffer = await file.arrayBuffer();

  return documentService.uploadDocument({
    referenceType,
    referenceId,
    documentType,
    fileBuffer: buffer,
    fileName: file.name,
    contentType: file.type,
  });
}
