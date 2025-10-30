'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Upload, X, Loader2, Video, FileVideo } from 'lucide-react'

interface ContractVideoUploadProps {
  currentVideoUrl?: string | null
  onVideoChange: (videoUrl: string | null) => void
  contractId?: string
}

export function ContractVideoUpload({ 
  currentVideoUrl, 
  onVideoChange, 
  contractId 
}: ContractVideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentVideoUrl || null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndUpload = useCallback(async (file: File) => {
    // Validar tipo de arquivo (apenas MP4)
    if (file.type !== 'video/mp4') {
      alert('Por favor, selecione apenas arquivos MP4.')
      return
    }

    // Validar tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('O vídeo deve ter no máximo 50MB.')
      return
    }

    setUploading(true)

    try {
      // Criar preview local
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileName = `contract_${contractId || timestamp}_${randomStr}.mp4`
      const filePath = contractId ? `${contractId}/${fileName}` : fileName

      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('contract-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Erro no upload:', error)
        throw error
      }

      // Obter URL do vídeo (bucket privado requer signed URL)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('contract-videos')
        .createSignedUrl(filePath, 31536000) // URL válida por 1 ano

      if (urlError) {
        console.error('Erro ao criar URL assinada:', urlError)
        throw urlError
      }

      // Passar o caminho do arquivo (não a URL) para que possamos gerar signed URLs quando necessário
      // ou passar a URL assinada que será usada imediatamente
      onVideoChange(signedUrlData.signedUrl)
      setPreviewUrl(signedUrlData.signedUrl)
    } catch (error) {
      console.error('Erro ao fazer upload do vídeo:', error)
      alert('Erro ao fazer upload do vídeo. Tente novamente.')
      setPreviewUrl(currentVideoUrl || null)
    } finally {
      setUploading(false)
    }
  }, [contractId, currentVideoUrl, onVideoChange])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await validateAndUpload(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    await validateAndUpload(file)
  }, [validateAndUpload])

  const handleRemoveVideo = async () => {
    setPreviewUrl(null)
    onVideoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = 'video-contrato.mp4'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
          Vídeo do Contrato
        </label>
        {previewUrl && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={uploading}
            >
              <FileVideo className="h-4 w-4 mr-1" />
              Baixar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveVideo}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        {previewUrl ? (
          <div className="relative w-full rounded-lg overflow-hidden border-2 border-border-light dark:border-border-dark bg-black">
            <video
              src={previewUrl}
              controls
              className="w-full h-auto max-h-[400px]"
            >
              Seu navegador não suporta a reprodução de vídeo.
            </video>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full min-h-[200px] rounded-lg border-2 border-dashed transition-colors ${
              isDragOver
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark'
            } flex flex-col items-center justify-center space-y-4 p-8 cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Enviando vídeo...
                </p>
              </>
            ) : (
              <>
                <Video className="h-16 w-16 text-text-secondary-light dark:text-text-secondary-dark" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    Arraste e solte um vídeo aqui
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    ou clique para selecionar
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!previewUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Vídeo
              </>
            )}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Formato aceito: MP4. Tamanho máximo: 50MB.
      </p>
    </div>
  )
}
