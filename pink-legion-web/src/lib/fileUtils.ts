import { supabase } from './supabase'

/**
 * Gera um nome único para arquivo baseado no NIF do cliente
 * @param clientNif - NIF do cliente (base do nome)
 * @param fileType - Tipo do arquivo ('contrato-venda' ou 'confissao-divida')
 * @param bucketName - Nome do bucket no Supabase Storage
 * @param folderPath - Caminho da pasta dentro do bucket (ex: 'contracts')
 * @returns Nome único do arquivo
 */
export async function generateUniqueFileName(
  clientNif: string,
  fileType: 'contrato-venda' | 'confissao-divida',
  bucketName: string = 'documents',
  folderPath: string = 'contracts'
): Promise<string> {
  try {
    // Limpar NIF (remover espaços e caracteres especiais)
    const cleanNif = clientNif.replace(/[^0-9]/g, '')
    
    // Nome base do arquivo
    const baseFileName = `${fileType}-${cleanNif}`
    
    // Listar arquivos existentes na pasta
    const { data: existingFiles, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 1000, // Limite para evitar problemas de performance
        search: baseFileName // Filtrar apenas arquivos que começam com o nome base
      })

    if (error) {
      console.error('Erro ao listar arquivos existentes:', error)
      // Em caso de erro, usar timestamp como fallback
      return `${baseFileName}-${Date.now()}.pdf`
    }

    // Se não há arquivos existentes, usar nome base
    if (!existingFiles || existingFiles.length === 0) {
      return `${baseFileName}.pdf`
    }

    // Procurar arquivos com o mesmo padrão
    const existingFileNames = existingFiles
      .map(file => file.name)
      .filter(name => name.startsWith(baseFileName))

    // Se não existe arquivo com nome base exato, usar ele
    const exactMatch = existingFileNames.find(name => name === `${baseFileName}.pdf`)
    if (!exactMatch) {
      return `${baseFileName}.pdf`
    }

    // Encontrar o próximo sufixo disponível
    let suffix = 2
    let uniqueFileName = `${baseFileName}-${suffix}.pdf`
    
    while (existingFileNames.includes(uniqueFileName)) {
      suffix++
      uniqueFileName = `${baseFileName}-${suffix}.pdf`
    }

    return uniqueFileName

  } catch (error) {
    console.error('Erro ao gerar nome único:', error)
    // Fallback: usar timestamp
    return `${fileType}-${clientNif}-${Date.now()}.pdf`
  }
}

/**
 * Verifica se um arquivo existe no bucket
 * @param fileName - Nome do arquivo
 * @param bucketName - Nome do bucket
 * @param folderPath - Caminho da pasta
 * @returns true se o arquivo existe, false caso contrário
 */
export async function fileExists(
  fileName: string,
  bucketName: string = 'documents',
  folderPath: string = 'contracts'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 1,
        search: fileName.replace('.pdf', '') // Remover extensão para busca
      })

    if (error) {
      console.error('Erro ao verificar existência do arquivo:', error)
      return false
    }

    return data?.some(file => file.name === fileName) || false

  } catch (error) {
    console.error('Erro ao verificar arquivo:', error)
    return false
  }
}

/**
 * Lista todos os arquivos de um cliente específico
 * @param clientNif - NIF do cliente
 * @param bucketName - Nome do bucket
 * @param folderPath - Caminho da pasta
 * @returns Lista de arquivos do cliente
 */
export async function listClientFiles(
  clientNif: string,
  bucketName: string = 'documents',
  folderPath: string = 'contracts'
): Promise<string[]> {
  try {
    const cleanNif = clientNif.replace(/[^0-9]/g, '')
    
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 1000,
        search: cleanNif
      })

    if (error) {
      console.error('Erro ao listar arquivos do cliente:', error)
      return []
    }

    return files?.map(file => file.name) || []

  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    return []
  }
}