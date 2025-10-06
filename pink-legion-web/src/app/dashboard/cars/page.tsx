'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Car, Plus, Search, Edit, Trash2, Eye } from 'lucide-react'

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
  purchase_price?: number
  sale_price?: number
  status: 'disponivel' | 'vendido' | 'reservado'
  notes?: string
  created_at: string
  updated_at: string
}

export default function CarsPage() {
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
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
    notes: ''
  })

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCars(data || [])
    } catch (error) {
      console.error('Erro ao buscar carros:', error)
    } finally {
      setLoading(false)
    }
  }

  const addCar = async () => {
    try {
      const { error } = await supabase
        .from('cars')
        .insert([formData])

      if (error) throw error
      
      fetchCars()
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao adicionar carro:', error)
    }
  }

  const updateCar = async () => {
    if (!selectedCar) return

    try {
      const { error } = await supabase
        .from('cars')
        .update(formData)
        .eq('id', selectedCar.id)

      if (error) throw error
      
      fetchCars()
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao atualizar carro:', error)
    }
  }

  const deleteCar = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este carro?')) return

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCars()
    } catch (error) {
      console.error('Erro ao excluir carro:', error)
    }
  }

  const resetForm = () => {
    setFormData({
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
      notes: ''
    })
    setSelectedCar(null)
  }

  const openEditModal = (car: Car) => {
    setSelectedCar(car)
    setFormData({
      brand: car.brand,
      model: car.model,
      license_plate: car.license_plate,
      vin: car.vin || '',
      year: car.year,
      mileage: car.mileage,
      color: car.color,
      engine: car.engine,
      purchase_price: car.purchase_price?.toString() || '',
      sale_price: car.sale_price?.toString() || '',
      status: car.status,
      notes: car.notes || ''
    })
    setShowEditModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300'
      case 'vendido':
        return 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300'
      case 'reservado':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300'
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível'
      case 'vendido':
        return 'Vendido'
      case 'reservado':
        return 'Reservado'
      default:
        return status
    }
  }

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || car.status === statusFilter
    const matchesBrand = !brandFilter || car.brand.toLowerCase().includes(brandFilter.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesBrand
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Gestão de Carros
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Gerencie o inventário de veículos da Pink Legion
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/cars/new')} className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Carro
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark h-4 w-4" />
                <Input
                  placeholder="Pesquisar carros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Todos os Status</option>
                <option value="disponivel">Disponível</option>
                <option value="vendido">Vendido</option>
                <option value="reservado">Reservado</option>
              </select>
              <Input
                placeholder="Filtrar por marca..."
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Total de Carros
                  </p>
                  <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    {cars.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                  <Car className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Disponíveis
                  </p>
                  <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {cars.filter(car => car.status === 'disponivel').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-success-100 dark:bg-success-900/20 rounded-xl flex items-center justify-center">
                  <Car className="h-6 w-6 text-success-600 dark:text-success-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Vendidos
                  </p>
                  <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                    {cars.filter(car => car.status === 'vendido').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-error-100 dark:bg-error-900/20 rounded-xl flex items-center justify-center">
                  <Car className="h-6 w-6 text-error-600 dark:text-error-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Reservados
                  </p>
                  <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                    {cars.filter(car => car.status === 'reservado').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-warning-100 dark:bg-warning-900/20 rounded-xl flex items-center justify-center">
                  <Car className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <Card key={car.id} hover>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {car.year} • {car.license_plate}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                    {getStatusText(car.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">Cor:</span>
                    <span className="text-text-primary-light dark:text-text-primary-dark">{car.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">Motor:</span>
                    <span className="text-text-primary-light dark:text-text-primary-dark">{car.engine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">Quilometragem:</span>
                    <span className="text-text-primary-light dark:text-text-primary-dark">
                      {car.mileage.toLocaleString('pt-PT')} km
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {car.sale_price ? parseFloat(car.sale_price.toString()).toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: 'EUR'
                    }) : 'Preço não definido'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/cars/${car.id}`)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/cars/${car.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCar(car.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCars.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Car className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Nenhum carro encontrado
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  Tente ajustar os filtros ou adicione um novo carro.
                </p>
                <Button onClick={() => router.push('/dashboard/cars/new')} className="bg-pink-600 hover:bg-pink-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Carro
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Car Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Adicionar Novo Carro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Marca"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
                <Input
                  placeholder="Modelo"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
                <Input
                  placeholder="Matrícula"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                />
                <Input
                  placeholder="Nº de Chassis (VIN)"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  maxLength={17}
                />
                <Input
                  type="number"
                  placeholder="Ano"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Quilometragem"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                />
                <Input
                  placeholder="Cor"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <Input
                  placeholder="Motor"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                />
                <Input
                  placeholder="Preço de Compra"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
                <Input
                  placeholder="Preço de Venda"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'disponivel' | 'vendido' | 'reservado' })}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="vendido">Vendido</option>
                  <option value="reservado">Reservado</option>
                </select>
                <textarea
                  placeholder="Notas adicionais sobre o veículo"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                />
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={addCar} className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Car Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Editar Carro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Marca"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
                <Input
                  placeholder="Modelo"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
                <Input
                  placeholder="Matrícula"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                />
                <Input
                  placeholder="Nº de Chassis (VIN)"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  maxLength={17}
                />
                <Input
                  type="number"
                  placeholder="Ano"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Quilometragem"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                />
                <Input
                  placeholder="Cor"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <Input
                  placeholder="Motor"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                />
                <Input
                  placeholder="Preço de Compra"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
                <Input
                  placeholder="Preço de Venda"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'disponivel' | 'vendido' | 'reservado' })}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="vendido">Vendido</option>
                  <option value="reservado">Reservado</option>
                </select>
                <textarea
                  placeholder="Notas adicionais sobre o veículo"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                />
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={updateCar} className="flex-1">
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}