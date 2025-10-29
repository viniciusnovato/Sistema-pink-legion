'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from './Button'
import { Upload, Trash2, Loader2, Star } from 'lucide-react'

interface CarPhoto {
  id: string
  photo_url: string
  photo_name: string
  uploaded_at: string
}

interface CarGalleryProps {
  carId: string
  photos: CarPhoto[]
  currentProfilePhotoUrl?: string | null
  onPhotosChange: () => void
  onSetAsProfilePhoto: (photoUrl: string) => void
}

export function CarGallery({ carId, photos, currentProfilePhotoUrl, onPhotosChange, onSetAsProfilePhoto }: CarGalleryProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${carId}_gallery_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('car-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('car-photos')
        .getPublicUrl(filePath)

      // Salvar na tabela car_photos
      const { error: dbError } = await supabase
        .from('car_photos')
        .insert({
          car_id: carId,
          photo_url: publicUrl,
          photo_name: file.name
        })

      if (dbError) throw dbError

      onPhotosChange()
      
      // Resetar input
      event.target.value = ''
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = photoUrl.split('/car-photos/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        // Deletar do Storage
        await supabase.storage
          .from('car-photos')
          .remove([filePath])
      }

      // Deletar do banco de dados
      const { error } = await supabase
        .from('car_photos')
        .delete()
        .eq('id', photoId)

      if (error) throw error

      onPhotosChange()
    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      alert('Erro ao deletar foto. Tente novamente.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Botão de Upload */}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="gallery-upload"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('gallery-upload')?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Foto à Galeria
            </>
          )}
        </Button>
      </div>

      {/* Grid de Fotos */}
      {photos.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Nenhuma foto na galeria ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => {
            const isProfilePhoto = photo.photo_url === currentProfilePhotoUrl
            return (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={photo.photo_name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                {/* Badge de Foto de Perfil */}
                {isProfilePhoto && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Perfil
                    </span>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  {!isProfilePhoto && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSetAsProfilePhoto(photo.photo_url)}
                      className="bg-white/90 hover:bg-white text-primary-600"
                      title="Definir como Foto de Perfil"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                    title="Excluir Foto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

