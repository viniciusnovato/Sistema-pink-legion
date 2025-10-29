'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { 
  Car, 
  ArrowLeft, 
  Save,
  Euro
} from 'lucide-react'
import { AdditionalCosts, type AdditionalCost } from '@/components/ui/AdditionalCosts'
import { CarPhotosManager } from '@/components/ui/CarPhotosManager'

interface Car {
  id: string
  brand: string
  model: string
  license_plate: string
  vin?: string
  year: number
  mileage: number
  color: string
  engine: string
  purchase_price?: string
  sale_price?: string
  status: 'disponivel' | 'vendido' | 'reservado'
  notes?: string
  photo_url?: string | null
  additional_costs?: AdditionalCost[] | null
  created_at: string
  updated_at: string
}

export default function EditCarPage() {
  const router = useRouter()
  const params = useParams()
  const carId = params.id as string

  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([])
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
    status: 'disponivel' as 'disponivel' | 'vendido' | 'reservado',
    notes: '',
    photo_url: null as string | null,
    additional_costs: [] as AdditionalCost[]
  })

  useEffect(() => {
    checkUser()
    fetchCar()
    fetchGalleryPhotos()
  }, [carId])

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

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single()

      if (error) {
        console.error('Erro ao buscar carro:', error)
        alert('Erro ao carregar dados do carro')
        return
      }

      setCar(data)
      setFormData({
        brand: data.brand || '',
        model: data.model || '',
        license_plate: data.license_plate || '',
        vin: data.vin || '',
        year: data.year || new Date().getFullYear(),
        mileage: data.mileage || 0,
        color: data.color || '',
        engine: data.engine || '',
        purchase_price: data.purchase_price || '',
        sale_price: data.sale_price || '',
        status: data.status || 'disponivel',
        notes: data.notes || '',
        photo_url: data.photo_url || null,
        additional_costs: (data.additional_costs as AdditionalCost[]) || []
      })
    } catch (error) {
      console.error('Erro ao buscar carro:', error)
      alert('Erro ao carregar dados do carro')
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleryPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('car_photos')
        .select('*')
        .eq('car_id', carId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setGalleryPhotos(data || [])
    } catch (error) {
      console.error('Erro ao buscar fotos da galeria:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('cars')
        .update({
          brand: formData.brand,
          model: formData.model,
          license_plate: formData.license_plate,
          year: formData.year,
          mileage: formData.mileage,
          color: formData.color,
          engine: formData.engine,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          status: formData.status,
          photo_url: formData.photo_url,
          additional_costs: formData.additional_costs,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId)

      if (error) {
        console.error('Erro ao atualizar carro:', error)
        alert('Erro ao salvar alterações')
        return
      }

      console.log('Carro atualizado com sucesso')
      alert('Carro atualizado com sucesso!')
      router.push(`/dashboard/cars/${carId}`)
    } catch (error) {
      console.error('Erro ao atualizar carro:', error)
      alert('Erro ao salvar alterações')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <DashboardLayout
        onLogout={handleLogout}
        userRole={profile?.role}
        userName={profile?.full_name || user?.email || ''}
        userEmail={user?.email || ''}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!car) {
    return (
      <DashboardLayout
        onLogout={handleLogout}
        userRole={profile?.role}
        userName={profile?.full_name || user?.email || ''}
        userEmail={user?.email || ''}
      >
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            Carro não encontrado
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            O carro que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => router.push('/dashboard/cars')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Button>
        </div>
      </DashboardLayout>
    )
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
              onClick={() => router.push(`/dashboard/cars/${carId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Editar Carro
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {car.brand} {car.model} • {car.license_plate}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
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
                        onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
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
                        onChange={(e) => handleInputChange('mileage', parseInt(e.target.value))}
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
                        placeholder="Ex: 1.6 Gasolina"
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
              {/* Galeria de Fotos Unificada */}
              <Card>
                <CardHeader>
                  <CardTitle>Galeria de Fotos</CardTitle>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    Gerencie todas as fotos do veículo e defina a foto de perfil
                  </p>
                </CardHeader>
                <CardContent>
                  <CarPhotosManager
                    carId={carId}
                    currentProfilePhotoUrl={formData.photo_url}
                    galleryPhotos={galleryPhotos}
                    onPhotosChange={fetchGalleryPhotos}
                    onProfilePhotoChange={(photoUrl) => handleInputChange('photo_url', photoUrl || '')}
                  />
                </CardContent>
              </Card>

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

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/cars/${carId}`)}
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