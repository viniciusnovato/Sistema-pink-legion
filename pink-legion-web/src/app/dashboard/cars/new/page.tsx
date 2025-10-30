'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Car, 
  ArrowLeft, 
  Save,
  Euro,
  Upload,
  X
} from 'lucide-react'
import { AdditionalCosts, type AdditionalCost } from '@/components/ui/AdditionalCosts'

export default function NewCarPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    license_plate: '',
    vin: '',
    year: new Date().getFullYear(),
    mileage: 0,
    color: '',
    engine: '',
    purchase_price: '',
    sale_price: '',
    status: 'disponivel',
    notes: '',
    additional_costs: [] as AdditionalCost[]
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handlePhotoUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    // Validar arquivos
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        alert(`Arquivo ${file.name} não é uma imagem válida`)
        return
      }
    }

    // Criar previews
    const newPreviews: string[] = []
    for (const file of fileArray) {
      const preview = URL.createObjectURL(file)
      newPreviews.push(preview)
    }

    setPreviewPhotos([...previewPhotos, ...newPreviews])
    setPhotoFiles([...photoFiles, ...fileArray])
  }

  const handleRemovePhoto = (index: number) => {
    const newPreviews = previewPhotos.filter((_, i) => i !== index)
    const newFiles = photoFiles.filter((_, i) => i !== index)
    setPreviewPhotos(newPreviews)
    setPhotoFiles(newFiles)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validar e converter campos numéricos
      const year = formData.year && !isNaN(formData.year) ? formData.year : new Date().getFullYear()
      const mileage = formData.mileage && !isNaN(formData.mileage) ? formData.mileage : 0
      const purchase_price = formData.purchase_price && formData.purchase_price.trim() !== '' ? formData.purchase_price : null
      const sale_price = formData.sale_price && formData.sale_price.trim() !== '' ? formData.sale_price : null

      const { data, error } = await supabase
        .from('cars')
        .insert([{
          brand: formData.brand,
          model: formData.model,
          license_plate: formData.license_plate,
          vin: formData.vin || null,
          year: year,
          mileage: mileage,
          color: formData.color,
          engine: formData.engine,
          purchase_price: purchase_price,
          sale_price: sale_price,
          status: formData.status,
          notes: formData.notes || null,
          additional_costs: formData.additional_costs
        }])
        .select()

      if (error) {
        console.error('Erro ao criar carro:', error)
        alert('Erro ao criar carro. Tente novamente.')
        return
      }

      // Upload das fotos se houver
      if (photoFiles.length > 0 && data && data[0]) {
        setUploadingPhotos(true)
        try {
          let firstPhotoUrl: string | null = null

          const uploadPromises = photoFiles.map(async (file, index) => {
            const fileExt = file.name.split('.').pop()
            const isProfilePhoto = index === 0
            const fileName = isProfilePhoto 
              ? `${data[0].id}_profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
              : `${data[0].id}_gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
            
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

            // Salvar a URL da primeira foto para usar como foto de perfil
            if (isProfilePhoto) {
              firstPhotoUrl = publicUrl
            }

            // Salvar na tabela car_photos
            await supabase
              .from('car_photos')
              .insert({
                car_id: data[0].id,
                photo_url: publicUrl,
                photo_name: file.name
              })
          })

          await Promise.all(uploadPromises)

          // Atualizar o carro com a primeira foto como foto de perfil
          if (firstPhotoUrl) {
            await supabase
              .from('cars')
              .update({ photo_url: firstPhotoUrl })
              .eq('id', data[0].id)
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload das fotos:', uploadError)
          alert('Carro criado, mas houve erro ao enviar algumas fotos. Você pode adicioná-las depois.')
        } finally {
          setUploadingPhotos(false)
        }
      }

      alert('Carro criado com sucesso!')
      
      // Redirecionar para a página de edição do carro criado
      if (data && data[0]) {
        router.push(`/dashboard/cars/${data[0].id}/edit`)
      } else {
        router.push('/dashboard/cars')
      }
    } catch (error) {
      console.error('Erro ao criar carro:', error)
      alert('Erro ao criar carro. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout
      onLogout={handleLogout}
      userRole={profile?.role}
      userName={profile?.full_name || user?.email || ''}
      userEmail={user?.email || ''}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/cars')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Adicionar Novo Carro
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Preencha os dados do novo veículo
              </p>
            </div>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Marca
                      </label>
                      <Input
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="Ex: Toyota"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Modelo
                      </label>
                      <Input
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="Ex: Corolla"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Matrícula
                      </label>
                      <Input
                        value={formData.license_plate}
                        onChange={(e) => handleInputChange('license_plate', e.target.value)}
                        placeholder="Ex: 12-AB-34"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        VIN (Número do Chassi)
                      </label>
                      <Input
                        value={formData.vin}
                        onChange={(e) => handleInputChange('vin', e.target.value)}
                        placeholder="Ex: 1HGBH41JXMN109186"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Ano
                      </label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value ? parseInt(e.target.value) : '')}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Quilometragem
                      </label>
                      <Input
                        type="number"
                        value={formData.mileage}
                        onChange={(e) => handleInputChange('mileage', e.target.value ? parseInt(e.target.value) : '')}
                        min="0"
                        placeholder="Ex: 50000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Cor
                      </label>
                      <Input
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        placeholder="Ex: Branco"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Motor
                      </label>
                      <Input
                        value={formData.engine}
                        onChange={(e) => handleInputChange('engine', e.target.value)}
                        placeholder="Ex: 1.6 16V"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Notas Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Adicione observações sobre o veículo..."
                      rows={4}
                      className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Euro className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Preços e Custos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Preço de Compra (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                        placeholder="Ex: 15000.00"
                      />
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Preço pago na compra do veículo
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                        Preço de Venda (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.sale_price}
                        onChange={(e) => handleInputChange('sale_price', e.target.value)}
                        placeholder="Ex: 18000.00"
                      />
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Preço para venda do veículo
                      </p>
                    </div>
                  </div>

                  {/* Divisor */}
                  <div className="border-t border-border-light dark:border-border-dark"></div>

                  {/* Custos Adicionais */}
                  <AdditionalCosts
                    costs={formData.additional_costs}
                    onChange={(costs) => handleInputChange('additional_costs', costs)}
                  />

                  {/* Divisor */}
                  <div className="border-t border-border-light dark:border-border-dark"></div>

                  {/* Resumo Financeiro */}
                  <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Preço de Compra:</span>
                      <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {(parseFloat(formData.purchase_price) || 0).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Custos Adicionais:</span>
                      <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {formData.additional_costs.reduce((sum, cost) => sum + (cost.value || 0), 0).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </span>
                    </div>
                    <div className="border-t border-border-light dark:border-border-dark pt-2 mt-2"></div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">Custo Total:</span>
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {((parseFloat(formData.purchase_price) || 0) + formData.additional_costs.reduce((sum, cost) => sum + (cost.value || 0), 0)).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border-light dark:border-border-dark mt-2">
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Preço de Venda:</span>
                      <span className="font-medium text-success-600 dark:text-success-400">
                        {(parseFloat(formData.sale_price) || 0).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Lucro Estimado:</span>
                      <span className={`font-semibold ${
                        ((parseFloat(formData.sale_price) || 0) - (parseFloat(formData.purchase_price) || 0) - formData.additional_costs.reduce((sum, cost) => sum + (cost.value || 0), 0)) >= 0
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-error-600 dark:text-error-400'
                      }`}>
                        {((parseFloat(formData.sale_price) || 0) - (parseFloat(formData.purchase_price) || 0) - formData.additional_costs.reduce((sum, cost) => sum + (cost.value || 0), 0)).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Status do Veículo
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as 'disponivel' | 'vendido' | 'reservado')}
                      className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="disponivel">Disponível</option>
                      <option value="reservado">Reservado</option>
                      <option value="vendido">Vendido</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Photos Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Fotos do Veículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                    className="hidden"
                    id="photos-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photos-upload')?.click()}
                    className="w-full mb-4"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Fotos
                  </Button>
                  
                  {previewPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {previewPhotos.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {previewPhotos.length === 0 && (
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
                      Nenhuma foto adicionada
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                      disabled={saving || uploadingPhotos}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving || uploadingPhotos ? 'Salvando...' : 'Criar Carro'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/cars')}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}