'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from './Button'
import { Upload, Trash2, Loader2, Star, ImageIcon as ImageIconLucide } from 'lucide-react'

interface CarPhoto {
  id: string
  photo_url: string
  photo_name: string
  uploaded_at: string
}

interface CarPhotosManagerProps {
  carId: string
  currentProfilePhotoUrl?: string | null
  galleryPhotos: CarPhoto[]
  onPhotosChange: () => void
  onProfilePhotoChange: (photoUrl: string | null) => void
}

export function CarPhotosManager({ 
  carId, 
  currentProfilePhotoUrl, 
  galleryPhotos,
  onPhotosChange,
  onProfilePhotoChange
}: CarPhotosManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadingProfile, setUploadingProfile] = useState(false)

  // Upload para galeria
  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  // Upload direto como foto de perfil
  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingProfile(true)

    try {
      // Se já existe uma foto de perfil, deletar do storage
      if (currentProfilePhotoUrl) {
        const oldPath = currentProfilePhotoUrl.split('/car-photos/')[1]
        if (oldPath) {
          await supabase.storage.from('car-photos').remove([oldPath])
        }
      }

      // Upload nova foto
      const fileExt = file.name.split('.').pop()
      const fileName = `${carId}_profile_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('car-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('car-photos')
        .getPublicUrl(fileName)

      // Atualizar no banco
      onProfilePhotoChange(publicUrl)
      
      // Resetar input
      event.target.value = ''
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setUploadingProfile(false)
    }
  }

  const handleSetAsProfilePhoto = (photoUrl: string) => {
    onProfilePhotoChange(photoUrl)
  }

  const handleRemoveProfilePhoto = async () => {
    if (!currentProfilePhotoUrl) return
    if (!confirm('Deseja remover a foto de perfil?')) return

    try {
      // Deletar do storage
      const filePath = currentProfilePhotoUrl.split('/car-photos/')[1]
      if (filePath) {
        await supabase.storage.from('car-photos').remove([filePath])
      }

      onProfilePhotoChange(null)
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      alert('Erro ao remover foto. Tente novamente.')
    }
  }

  const handleDeleteGalleryPhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    try {
      // Se for a foto de perfil, avisar
      if (photoUrl === currentProfilePhotoUrl) {
        const confirmed = confirm('Esta é a foto de perfil. Ao excluir, a foto de perfil será removida. Deseja continuar?')
        if (!confirmed) return
        onProfilePhotoChange(null)
      }

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

  // Combinar todas as fotos únicas
  const allUniquePhotos = () => {
    const photosMap = new Map<string, { url: string; id?: string; name?: string; isProfile: boolean }>()
    
    // Adicionar foto de perfil
    if (currentProfilePhotoUrl) {
      photosMap.set(currentProfilePhotoUrl, {
        url: currentProfilePhotoUrl,
        isProfile: true,
        name: 'Foto de Perfil'
      })
    }
    
    // Adicionar fotos da galeria
    galleryPhotos.forEach(photo => {
      if (!photosMap.has(photo.photo_url)) {
        photosMap.set(photo.photo_url, {
          url: photo.photo_url,
          id: photo.id,
          name: photo.photo_name,
          isProfile: false
        })
      } else {
        // Se já existe (é a foto de perfil), atualizar com o ID da galeria
        const existing = photosMap.get(photo.photo_url)!
        photosMap.set(photo.photo_url, {
          ...existing,
          id: photo.id,
          name: photo.photo_name
        })
      }
    })
    
    return Array.from(photosMap.values())
  }

  const uniquePhotos = allUniquePhotos()

  return (
    <div className="space-y-4">
      {/* Botões de Upload */}
      <div className="grid grid-cols-2 gap-3">
        {/* Upload como Foto de Perfil */}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoUpload}
            className="hidden"
            id="profile-photo-upload"
            disabled={uploadingProfile}
          />
          <Button
            type="button"
            variant="default"
            onClick={() => document.getElementById('profile-photo-upload')?.click()}
            disabled={uploadingProfile}
            className="w-full"
          >
            {uploadingProfile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                {currentProfilePhotoUrl ? 'Alterar Perfil' : 'Adicionar Perfil'}
              </>
            )}
          </Button>
        </div>

        {/* Upload para Galeria */}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleGalleryUpload}
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
                Adicionar Foto
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid de Fotos */}
      {uniquePhotos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
          <ImageIconLucide className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-3" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
            Nenhuma foto adicionada ainda
          </p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Adicione uma foto de perfil ou fotos à galeria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uniquePhotos.map((photo, index) => {
            const isProfilePhoto = photo.url === currentProfilePhotoUrl
            const isInGallery = !!photo.id
            
            return (
              <div key={photo.url + index} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.name || 'Foto do veículo'}
                  className={`w-full h-40 object-cover rounded-lg transition-all ${
                    isProfilePhoto ? 'ring-2 ring-primary-600 dark:ring-primary-400' : ''
                  }`}
                />
                
                {/* Badge de Foto de Perfil */}
                {isProfilePhoto && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                      Foto de Perfil
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
                      onClick={() => handleSetAsProfilePhoto(photo.url)}
                      className="bg-white/95 hover:bg-white text-primary-600"
                      title="Definir como Foto de Perfil"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {isProfilePhoto && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveProfilePhoto}
                      className="bg-white/95 hover:bg-white text-orange-600"
                      title="Remover como Foto de Perfil"
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </Button>
                  )}
                  
                  {isInGallery && photo.id && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGalleryPhoto(photo.id!, photo.url)}
                      title="Excluir Foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legenda */}
      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark p-3 rounded-lg">
        <p className="font-medium mb-1">💡 Dicas:</p>
        <ul className="space-y-1 ml-4">
          <li>• <strong>Adicionar Perfil:</strong> Faz upload e define automaticamente como foto de perfil</li>
          <li>• <strong>Adicionar Foto:</strong> Adiciona à galeria (pode definir como perfil depois)</li>
          <li>• <strong>Estrela:</strong> Clique para definir/remover foto de perfil</li>
          <li>• <strong>Lixeira:</strong> Exclui a foto permanentemente</li>
        </ul>
      </div>
    </div>
  )
}

