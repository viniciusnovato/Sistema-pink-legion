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
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  FileText, 
  Image as ImageIcon,
  Calendar,
  Gauge,
  Palette,
  Fuel,
  Euro,
  MapPin
} from 'lucide-react'

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
  created_at: string
  updated_at: string
}

interface CarPhoto {
  id: string
  car_id: string
  photo_url: string
  photo_name: string
  uploaded_at: string
}

interface CarDocument {
  id: string
  car_id: string
  document_name: string
  document_url: string
  document_type: string
  uploaded_at: string
}

export default function CarDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const carId = params.id as string

  const [car, setCar] = useState<Car | null>(null)
  const [photos, setPhotos] = useState<CarPhoto[]>([])
  const [documents, setDocuments] = useState<CarDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (carId) {
      fetchCarDetails()
      fetchCarPhotos()
      fetchCarDocuments()
    }
  }, [carId])

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single()

      if (error) throw error
      setCar(data)
    } catch (error) {
      console.error('Erro ao buscar detalhes do carro:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCarPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('car_photos')
        .select('*')
        .eq('car_id', carId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Erro ao buscar fotos do carro:', error)
    }
  }

  const fetchCarDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('car_documents')
        .select('*')
        .eq('car_id', carId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao buscar documentos do carro:', error)
    }
  }

  const uploadPhoto = async (file: File) => {
    if (!car) return

    try {
      setUploading(true)
      
      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${car.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('car-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obter URL pública da foto
      const { data: { publicUrl } } = supabase.storage
        .from('car-photos')
        .getPublicUrl(fileName)

      // Salvar referência no banco de dados
      const { error: dbError } = await supabase
        .from('car_photos')
        .insert({
          car_id: car.id,
          photo_url: publicUrl,
          photo_name: file.name
        })

      if (dbError) throw dbError

      // Recarregar fotos
       fetchCarPhotos()
       
       console.log('Foto enviada com sucesso!')
     } catch (error) {
       console.error('Erro ao enviar foto:', error)
       alert('Erro ao enviar foto')
     } finally {
      setUploading(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await uploadPhoto(file)
  }

  const uploadDocument = async (file: File) => {
    if (!car) return

    try {
      setUploading(true)
      
      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${car.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obter URL assinada do documento (bucket privado)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileName, 3600) // URL válida por 1 hora

      if (urlError) throw urlError

      // Salvar referência no banco de dados
      const { error: dbError } = await supabase
        .from('car_documents')
        .insert({
          car_id: car.id,
          document_url: signedUrlData.signedUrl,
          document_name: file.name,
          document_type: file.type
        })

      if (dbError) throw dbError

      // Recarregar documentos
      fetchCarDocuments()
      
      console.log('Documento enviado com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar documento:', error)
      alert('Erro ao enviar documento')
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await uploadDocument(file)
  }

  const downloadDocument = async (documentUrl: string, documentName: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = documentUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      // Se a URL ainda referencia 'car-documents', usar o bucket correto
      let bucketName: string
      let filePath: string
      
      if (documentUrl.includes('car-documents')) {
        // URL antiga: usar bucket 'car-documents' onde os arquivos realmente estão
        bucketName = 'car-documents'
        const carDocumentsIndex = urlParts.findIndex(part => part === 'car-documents')
        if (carDocumentsIndex !== -1 && carDocumentsIndex + 2 < urlParts.length) {
          const carId = urlParts[carDocumentsIndex + 1]
          filePath = `${carId}/${fileName}`
        } else {
          filePath = fileName
        }
      } else {
        // URL nova: usar bucket 'documents'
        bucketName = 'documents'
        filePath = urlParts.slice(-2).join('/')
      }
      
      // Gerar URL assinada para download
      const { data: signedUrlData, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600) // Válida por 1 hora
      
      if (error) {
        console.error('Erro ao gerar URL de download:', error)
        if (error.message.includes('Object not found')) {
          alert('Documento não encontrado. O arquivo pode ter sido movido ou excluído.')
        } else {
          alert('Erro ao gerar link de download: ' + error.message)
        }
        return
      }
      
      // Abrir URL assinada
      window.open(signedUrlData.signedUrl, '_blank')
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      alert('Erro ao fazer download do documento')
    }
  }

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = photoUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${car?.id}/${fileName}`

      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from('car-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Deletar do banco de dados
      const { error: dbError } = await supabase
        .from('car_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Recarregar fotos
      fetchCarPhotos()
      
      console.log('Foto excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir foto:', error)
      alert('Erro ao excluir foto')
    }
  }

  const deleteDocument = async (documentId: string, documentUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = documentUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${car?.id}/${fileName}`

      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError

      // Deletar do banco de dados
      const { error: dbError } = await supabase
        .from('car_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      // Recarregar documentos
      fetchCarDocuments()
      
      console.log('Documento excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      alert('Erro ao excluir documento')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
      case 'vendido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'reservado':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!car) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {car.brand} {car.model}
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {car.license_plate} • {car.year}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/cars/${car.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Car Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Informações do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Marca/Modelo</p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {car.brand} {car.model}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Matrícula</p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {car.license_plate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Ano</p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {car.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <Gauge className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Quilometragem</p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {car.mileage.toLocaleString('pt-PT')} km
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Cor</p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {car.color}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <Fuel className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Motor</p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {car.engine}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Fotos do Veículo ({photos.length})
                  </CardTitle>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Adicionar Foto'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" />
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      Nenhuma foto adicionada ainda
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt={photo.photo_name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePhoto(photo.id, photo.photo_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Documentação ({documents.length})
                  </CardTitle>
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('document-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Adicionar Documento'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" />
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      Nenhum documento adicionado ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between p-3 border border-border-light dark:border-border-dark rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                              {document.document_name}
                            </p>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                              {document.document_type.toUpperCase()} • {new Date(document.uploaded_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(document.document_url, document.document_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDocument(document.id, document.document_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price & Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {/* Preços */}
                  <div className="space-y-3">
                    {car.purchase_price && (
                      <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Preço de Compra</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {parseFloat(car.purchase_price).toLocaleString('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                      </div>
                    )}
                    
                    {car.sale_price && (
                      <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Preço de Venda</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {parseFloat(car.sale_price).toLocaleString('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Preço de Venda</p>
                      <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {parseFloat(car.sale_price || '0').toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </p>
                    </div>
                    
                    {/* Margem de lucro */}
                    {car.purchase_price && car.sale_price && (
                      <div className="pt-2 border-t border-border-light dark:border-border-dark">
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Margem Estimada</p>
                        <p className={`text-lg font-semibold ${
                          parseFloat(car.sale_price) > parseFloat(car.purchase_price) 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {(parseFloat(car.sale_price) - parseFloat(car.purchase_price)).toLocaleString('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(car.status)}`}>
                      {getStatusText(car.status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">Fotos:</span>
                  <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">Documentos:</span>
                  <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">Criado em:</span>
                  <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    {new Date(car.created_at).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}