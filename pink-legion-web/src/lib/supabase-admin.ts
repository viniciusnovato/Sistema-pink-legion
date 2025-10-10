import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service_role para operações administrativas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzkgjtxrzwzoibzesphi.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyMzQwOCwiZXhwIjoyMDc0Mjk5NDA4fQ.KZ3cqy2fN5UDnp8TG_mV6fRJgqo1Myb0Djud77plDL8'

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Gera uma URL assinada para download de documentos usando service_role
 * @param bucketName Nome do bucket (ex: 'documents', 'car-documents', etc.)
 * @param filePath Caminho do arquivo no bucket
 * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
 * @returns Promise com a URL assinada ou erro
 */
export async function createSignedDownloadUrl(
  bucketName: string, 
  filePath: string, 
  expiresIn: number = 3600
) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('[createSignedDownloadUrl] Erro:', error)
      throw error
    }

    return { signedUrl: data.signedUrl, error: null }
  } catch (error) {
    console.error('[createSignedDownloadUrl] Exceção:', error)
    return { signedUrl: null, error }
  }
}

/**
 * Lista arquivos em um bucket usando service_role
 * @param bucketName Nome do bucket
 * @param path Caminho dentro do bucket (opcional)
 * @param options Opções de listagem
 * @returns Promise com a lista de arquivos ou erro
 */
export async function listFiles(
  bucketName: string, 
  path: string = '', 
  options: { limit?: number; offset?: number } = {}
) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list(path, {
        limit: options.limit || 100,
        offset: options.offset || 0
      })

    if (error) {
      console.error('[listFiles] Erro:', error)
      throw error
    }

    return { files: data, error: null }
  } catch (error) {
    console.error('[listFiles] Exceção:', error)
    return { files: null, error }
  }
}