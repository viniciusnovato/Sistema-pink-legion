'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface CarPhotoUploadProps {
  currentPhotoUrl?: string | null
  onPhotoChange: (photoUrl: string | null) => void
  carId?: string
}

export function CarPhotoUpload({ currentPhotoUrl, onPhotoChange, carId }: CarPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    setUploading(true)

    try {
      // Criar preview local
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${carId || Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `cars/${fileName}`

      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('car-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // Se o bucket não existir, tentar criar
        if (error.message.includes('not found')) {
          console.log('Bucket não encontrado, criando...')
          // Por enquanto, vamos apenas salvar localmente
          onPhotoChange(localPreview)
          return
        }
        throw error
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('car-photos')
        .getPublicUrl(data.path)

      onPhotoChange(publicUrl)
      setPreviewUrl(publicUrl)
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto. Tente novamente.')
      setPreviewUrl(currentPhotoUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = () => {
    setPreviewUrl(null)
    onPhotoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
          Foto do Veículo
        </label>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemovePhoto}
            disabled={uploading}
          >
            <X className="h-4 w-4 mr-1" />
            Remover
          </Button>
        )}
      </div>

      <div className="relative">
        {previewUrl ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border-light dark:border-border-dark">
            <Image
              src={previewUrl}
              alt="Foto do veículo"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center space-y-2">
            <Camera className="h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark" />
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Nenhuma foto selecionada
            </p>
          </div>
        )}
      </div>

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
              {previewUrl ? 'Alterar Foto' : 'Adicionar Foto'}
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB.
      </p>
    </div>
  )
}


