import { supabase } from './supabase'
import type { Document, DocumentReferenceType } from '../types/database'

export interface CreateDocumentData {
  reference_type: DocumentReferenceType
  reference_id: string
  document_type: string
  file: File
}

export interface DocumentWithUrl extends Document {
  url?: string
}

const STORAGE_BUCKET = 'documents'

/**
 * Upload document and create database record
 */
export async function uploadDocument({
  reference_type,
  reference_id,
  document_type,
  file
}: CreateDocumentData): Promise<Document> {
  try {
    // Generate unique file path
    const timestamp = new Date().getTime()
    const fileExt = file.name.split('.').pop()
    const fileName = `${reference_type}/${reference_id}/${timestamp}_${document_type}.${fileExt}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Create database record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        reference_type,
        reference_id,
        file_path: uploadData.path,
        document_type,
      })
      .select()
      .single()

    if (docError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadData.path])
      throw docError
    }

    return docData
  } catch (error) {
    console.error('Document upload error:', error)
    throw error
  }
}

/**
 * Get documents for a reference (vehicle or driver)
 */
export async function getDocuments(
  reference_type: DocumentReferenceType,
  reference_id: string
): Promise<DocumentWithUrl[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('reference_type', reference_type)
    .eq('reference_id', reference_id)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Add signed URLs for each document
  const documentsWithUrls = await Promise.all(
    (data || []).map(async (doc) => {
      const { data: urlData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(doc.file_path, 3600) // 1 hour expiry

      return {
        ...doc,
        url: urlData?.signedUrl
      }
    })
  )

  return documentsWithUrls
}

/**
 * Delete document
 */
export async function deleteDocument(id: string): Promise<void> {
  // Get document to find file path
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single()

  if (fetchError || !document) return

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([document.file_path])

  if (storageError) {
    console.warn('Failed to delete file from storage:', storageError)
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (dbError) throw dbError
}