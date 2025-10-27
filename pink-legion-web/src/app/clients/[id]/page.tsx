'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Edit, User, Phone, Mail, MapPin, Briefcase, FileText, Upload, Trash2, Download, Image as ImageIcon, CreditCard, Calendar, Euro } from 'lucide-react'
import { logger } from '@/lib/logger'
import { getBankByIban, getBicByIban, isValidPortugueseIban, formatIban } from '@/lib/portuguese-banks'

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  nif: string | null;
  cc: string | null;
  passport: string | null;
  has_cc: boolean | null;
  birth_date: string | null;
  profession: string | null;
  monthly_income: number | null;
  status: string | null;
  created_at: string;
  iban: string | null;
  street: string | null;
  number: string | null;
  city: string | null;
  postal_code: string | null;
  card_number: string | null;
  card_holder_name: string | null;
  card_expiry: string | null;
  card_cvv: string | null;
}

interface ClientPhoto {
  id: string
  client_id: string
  photo_name: string
  photo_url: string
  uploaded_at: string
}

interface ClientDocument {
  id: string
  client_id: string
  document_type: string
  document_name: string
  document_url: string
  uploaded_at: string
}

export default function ClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [photos, setPhotos] = useState<ClientPhoto[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [ibanInput, setIbanInput] = useState('')
  const [detectedBic, setDetectedBic] = useState('')
  const [detectedBank, setDetectedBank] = useState('')

  useEffect(() => {
    if (clientId) {
      fetchClient()
      fetchPhotos()
      fetchDocuments()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, has_cc, passport')
        .eq('id', clientId)
        .single()

      if (error) throw error
      setClient(data)
      
      // Pré-preencher IBAN se existir nos dados do cliente
      if (data.iban) {
        setIbanInput(data.iban)
        handleIbanChange(data.iban)
      }
    } catch (error) {
      logger.error('Erro ao carregar cliente', error as Error, 'CLIENT_FETCH')
      router.push('/clients')
    }
  }

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('client_photos')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      logger.error('Erro ao carregar fotos', error as Error, 'CLIENT_PHOTOS_FETCH')
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      logger.error('Erro ao carregar documentos', error as Error, 'CLIENT_DOCUMENTS_FETCH')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${clientId}_${Date.now()}.${fileExt}`
      const filePath = `client-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública da foto
      const { data: { publicUrl } } = supabase.storage
        .from('client-files')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('client_photos')
        .insert([{
          client_id: clientId,
          photo_name: file.name,
          photo_url: publicUrl
        }])

      if (dbError) throw dbError

      logger.info('Foto carregada com sucesso', 'CLIENT_PHOTO_UPLOAD', { fileName })
      fetchPhotos()
    } catch (error) {
      logger.error('Erro ao carregar foto', error as Error, 'CLIENT_PHOTO_UPLOAD')
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${clientId}_${Date.now()}.${fileExt}`
      const filePath = `client-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública do documento
      const { data: { publicUrl } } = supabase.storage
        .from('client-files')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('client_documents')
        .insert([{
          client_id: clientId,
          document_type: 'general',
          document_name: file.name,
          document_url: publicUrl
        }])

      if (dbError) throw dbError

      logger.info('Documento carregado com sucesso', 'CLIENT_DOCUMENT_UPLOAD', { fileName })
      fetchDocuments()
    } catch (error) {
      logger.error('Erro ao carregar documento', error as Error, 'CLIENT_DOCUMENT_UPLOAD')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('client-files')
        .remove([filePath])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('client_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      logger.info('Foto removida com sucesso', 'CLIENT_PHOTO_DELETE', { photoId })
      fetchPhotos()
    } catch (error) {
      logger.error('Erro ao remover foto', error as Error, 'CLIENT_PHOTO_DELETE')
    }
  }

  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('client-files')
        .remove([filePath])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      logger.info('Documento removido com sucesso', 'CLIENT_DOCUMENT_DELETE', { documentId })
      fetchDocuments()
    } catch (error) {
      logger.error('Erro ao remover documento', error as Error, 'CLIENT_DOCUMENT_DELETE')
    }
  }

  const handleSpecificDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${clientId}_${documentType}_${Date.now()}.${fileExt}`
      const filePath = `client-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública do documento
      const { data: { publicUrl } } = supabase.storage
        .from('client-files')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('client_documents')
        .insert([{
          client_id: clientId,
          document_type: documentType,
          document_name: file.name,
          document_url: publicUrl
        }])

      if (dbError) throw dbError

      logger.info('Documento específico carregado com sucesso', 'CLIENT_SPECIFIC_DOCUMENT_UPLOAD', { fileName, documentType })
      fetchDocuments()
    } catch (error) {
      logger.error('Erro ao carregar documento específico', error as Error, 'CLIENT_SPECIFIC_DOCUMENT_UPLOAD')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentsByType = (documentType: string): ClientDocument[] => {
    return documents.filter(doc => doc.document_type === documentType)
  }

  const handleIbanChange = (value: string) => {
    setIbanInput(value)
    
    if (value.length >= 25) {
      const bank = getBankByIban(value)
      const bic = getBicByIban(value)
      
      if (bank && bic) {
        setDetectedBank(bank.name)
        setDetectedBic(bic)
        logger.info('BIC/SWIFT detectado automaticamente', 'IBAN_BIC_DETECTION', { 
          bank: bank.name, 
          bic: bic 
        })
      } else {
        setDetectedBank('')
        setDetectedBic('')
      }
    } else {
      setDetectedBank('')
      setDetectedBic('')
    }
  }

  const getMaritalStatusLabel = (status: string) => {
    const labels = {
      single: 'Solteiro(a)',
      married: 'Casado(a)',
      divorced: 'Divorciado(a)',
      widowed: 'Viúvo(a)'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Sem status'
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente',
      blocked: 'Bloqueado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return 'text-gray-600 bg-gray-100'
    const colors = {
      active: 'text-green-600 bg-green-100',
      inactive: 'text-gray-600 bg-gray-100',
      pending: 'text-yellow-600 bg-yellow-100',
      blocked: 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Cliente não encontrado
          </h2>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {client.full_name}
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Cliente desde {new Date(client.created_at).toLocaleDateString('pt-PT')}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => router.push(`/clients/${clientId}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
            {getStatusLabel(client.status)}
          </span>
        </div>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Telefone</p>
                  <p className="font-medium">{client.phone || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">NIF</p>
                  <p className="font-medium">{client.nif}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {client?.has_cc ? 'Cartão de Cidadão' : 'Passaporte'}
                  </p>
                  <p className="font-medium">
                    {client?.has_cc ? (client.cc || 'Não informado') : (client.passport || 'Não informado')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Data de Nascimento</p>
                  <p className="font-medium">
                    {client.birth_date ? new Date(client.birth_date).toLocaleDateString('pt-PT') : 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Profissão</p>
                  <p className="font-medium">{client.profession || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Euro className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Rendimento Mensal</p>
                  <p className="font-medium">
                    {client.monthly_income ? `€${client.monthly_income.toLocaleString('pt-PT')}` : 'Não informado'}
                  </p>
                </div>
              </div>
              
              {/* Dados do Cartão Bancário */}
              {(client.card_number || client.card_holder_name || client.card_expiry || client.card_cvv) && (
                <>
                  <div className="col-span-2 border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                      Dados do Cartão Bancário
                    </h4>
                  </div>
                  {client.card_number && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                      <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Número do Cartão</p>
                        <p className="font-medium">{client.card_number}</p>
                      </div>
                    </div>
                  )}
                  {client.card_holder_name && (
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                      <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Nome do Titular</p>
                        <p className="font-medium">{client.card_holder_name}</p>
                      </div>
                    </div>
                  )}
                  {client.card_expiry && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                      <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Data de Validade</p>
                        <p className="font-medium">{client.card_expiry}</p>
                      </div>
                    </div>
                  )}
                  {client.card_cvv && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                      <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">CVV</p>
                        <p className="font-medium">{client.card_cvv}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                Fotos ({photos.length})
              </div>
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
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Carregando...' : 'Carregar Foto'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                Nenhuma foto carregada
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-surface-light dark:bg-surface-dark rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={photo.photo_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                        variant="ghost"
                        className="p-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                      {photo.photo_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentos Obrigatórios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documentos Obrigatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Documento de Identificação */}
              <div className="border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Documento de Identificação com Foto
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Cartão de Cidadão ou Passaporte (caso não tenha CC)
                </p>
                {client && (client.cc || client.passport) && (
                  <div className="mb-3 p-3 bg-background-light dark:bg-background-dark rounded-lg border">
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {client.has_cc ? 'Cartão de Cidadão registrado:' : 'Passaporte registrado:'}
                    </p>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      {client.has_cc ? client.cc : client.passport}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSpecificDocumentUpload(e, 'documento_identificacao')}
                    className="hidden"
                    id="doc-id-upload"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('doc-id-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Documento
                  </Button>
                </div>
                {getDocumentsByType('documento_identificacao').length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getDocumentsByType('documento_identificacao').map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <div className="flex flex-col">
                          <span className="text-sm text-green-700 dark:text-green-300">{doc.document_name}</span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {client?.has_cc ? 'Cartão de Cidadão' : 'Passaporte'}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                          variant="ghost"
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NIF */}
              <div className="border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  NIF (Número de Identificação Fiscal)
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Comprovativo do NIF
                </p>
                {client && client.nif && (
                  <div className="mb-3 p-3 bg-background-light dark:bg-background-dark rounded-lg border">
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">NIF registrado:</p>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{client.nif}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSpecificDocumentUpload(e, 'nif')}
                    className="hidden"
                    id="nif-upload"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('nif-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar NIF
                  </Button>
                </div>
                {getDocumentsByType('nif').length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getDocumentsByType('nif').map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <span className="text-sm text-green-700 dark:text-green-300">{doc.document_name}</span>
                        <Button
                          onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                          variant="ghost"
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comprovativo de IBAN */}
              <div className="border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
                  <Euro className="h-4 w-4 mr-2" />
                  Comprovativo de IBAN
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Documento bancário com IBAN da conta
                </p>
                
                {/* IBAN Input for automatic BIC detection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    IBAN (para detecção automática do BIC/SWIFT)
                  </label>
                  <input
                    type="text"
                    value={ibanInput}
                    onChange={(e) => handleIbanChange(e.target.value.toUpperCase())}
                    placeholder="PT50 0000 0000 0000 0000 0000 0"
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
                    maxLength={29}
                  />
                  {detectedBank && detectedBic && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Banco detectado:</strong> {detectedBank}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>BIC/SWIFT:</strong> {detectedBic}
                      </p>
                    </div>
                  )}
                  {ibanInput.length >= 25 && !detectedBank && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        IBAN não reconhecido como banco português ou formato inválido
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSpecificDocumentUpload(e, 'iban')}
                    className="hidden"
                    id="iban-upload"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('iban-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar IBAN
                  </Button>
                </div>
                {getDocumentsByType('iban').length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getDocumentsByType('iban').map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <span className="text-sm text-green-700 dark:text-green-300">{doc.document_name}</span>
                        <Button
                          onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                          variant="ghost"
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cartão Bancário */}
              <div className="border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Cartão Bancário (Frente e Verso)
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  De preferência o mesmo cartão da conta que dará o IBAN
                </p>
                
                {/* Pré-preenchimento dos dados do cartão */}
                {(client.card_number || client.card_holder_name || client.card_expiry || client.card_cvv) && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Dados do cartão registados:
                    </p>
                    {client.card_number && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Número:</strong> {client.card_number}
                      </p>
                    )}
                    {client.card_holder_name && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Titular:</strong> {client.card_holder_name}
                      </p>
                    )}
                    {client.card_expiry && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Validade:</strong> {client.card_expiry}
                      </p>
                    )}
                    {client.card_cvv && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>CVV:</strong> {client.card_cvv}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frente do Cartão */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Frente do Cartão</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleSpecificDocumentUpload(e, 'cartao_frente')}
                      className="hidden"
                      id="card-front-upload"
                      disabled={uploading}
                    />
                    <Button
                      onClick={() => document.getElementById('card-front-upload')?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="w-full text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Carregar Frente
                    </Button>
                    {getDocumentsByType('cartao_frente').length > 0 && (
                      <div className="mt-2">
                        {getDocumentsByType('cartao_frente').map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <span className="text-xs text-green-700 dark:text-green-300">{doc.document_name}</span>
                            <Button
                              onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                              variant="ghost"
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verso do Cartão */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Verso do Cartão</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleSpecificDocumentUpload(e, 'cartao_verso')}
                      className="hidden"
                      id="card-back-upload"
                      disabled={uploading}
                    />
                    <Button
                      onClick={() => document.getElementById('card-back-upload')?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="w-full text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Carregar Verso
                    </Button>
                    {getDocumentsByType('cartao_verso').length > 0 && (
                      <div className="mt-2">
                        {getDocumentsByType('cartao_verso').map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <span className="text-xs text-green-700 dark:text-green-300">{doc.document_name}</span>
                            <Button
                              onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                              variant="ghost"
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comprovativo de Morada */}
              <div className="border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Comprovativo de Morada
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Fatura de serviços ou documento oficial com morada atual
                </p>
                
                {/* Morada pré-preenchida do cliente */}
                {client && client.address && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                      Morada registada:
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {(() => {
                        try {
                          const addressData = typeof client.address === 'string' 
                            ? JSON.parse(client.address) 
                            : client.address;
                          return [
                            addressData.street,
                            addressData.number,
                            addressData.city,
                            addressData.postal_code
                          ].filter(Boolean).join(', ');
                        } catch (e) {
                          // Fallback para campos individuais se o JSON estiver corrompido
                          return [client.street, client.number, client.city, client.postal_code].filter(Boolean).join(', ');
                        }
                      })()}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSpecificDocumentUpload(e, 'comprovativo_morada')}
                    className="hidden"
                    id="address-upload"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('address-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Comprovativo
                  </Button>
                </div>
                {getDocumentsByType('comprovativo_morada').length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getDocumentsByType('comprovativo_morada').map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <span className="text-sm text-green-700 dark:text-green-300">{doc.document_name}</span>
                        <Button
                          onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                          variant="ghost"
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BIC/SWIFT */}
              <div className="border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
                  <Euro className="h-4 w-4 mr-2" />
                  BIC/SWIFT do Banco
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Para autorização SEPA - será preenchido automaticamente para bancos portugueses
                </p>
                
                {/* Display detected BIC/SWIFT */}
                {detectedBic && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>BIC/SWIFT detectado automaticamente:</strong> {detectedBic}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Baseado no IBAN inserido acima ({detectedBank})
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSpecificDocumentUpload(e, 'bic_swift')}
                    className="hidden"
                    id="bic-upload"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('bic-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="text-pink-600 border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar BIC/SWIFT
                  </Button>
                </div>
                {getDocumentsByType('bic_swift').length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getDocumentsByType('bic_swift').map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <span className="text-sm text-green-700 dark:text-green-300">{doc.document_name}</span>
                        <Button
                          onClick={() => handleDeleteDocument(doc.id, doc.document_url)}
                          variant="ghost"
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Outros Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Outros Documentos ({documents.filter(doc => !['documento_identificacao', 'nif', 'iban', 'cartao_frente', 'cartao_verso', 'comprovativo_morada', 'bic_swift'].includes(doc.document_type)).length})
              </span>
              <Button
                onClick={() => document.getElementById('document-upload')?.click()}
                disabled={uploading}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'A carregar...' : 'Adicionar Documento'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              id="document-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleDocumentUpload}
              className="hidden"
            />
            {documents.filter(doc => !['documento_identificacao', 'nif', 'iban', 'cartao_frente', 'cartao_verso', 'comprovativo_morada', 'bic_swift'].includes(doc.document_type)).length === 0 ? (
              <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento adicional</p>
                <p className="text-sm">Clique em "Adicionar Documento" para carregar outros documentos</p>
                <p className="text-xs mt-2 opacity-75">
                  Formatos aceites: PDF, DOC, DOCX, JPG, JPEG, PNG
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.filter(doc => !['documento_identificacao', 'nif', 'iban', 'cartao_frente', 'cartao_verso', 'comprovativo_morada', 'bic_swift'].includes(doc.document_type)).map((document) => (
                  <div
                    key={document.id}
                    className="border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {document.document_name.toLowerCase().includes('image') || 
                         document.document_name.toLowerCase().endsWith('.jpg') ||
                         document.document_name.toLowerCase().endsWith('.jpeg') ||
                         document.document_name.toLowerCase().endsWith('.png') ? (
                          <ImageIcon className="h-8 w-8 text-pink-600" />
                        ) : (
                          <FileText className="h-8 w-8 text-pink-600" />
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteDocument(document.id, document.document_url)}
                        variant="ghost"
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1 truncate">
                      {document.document_name}
                    </h4>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                      Documento carregado
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                      {new Date(document.uploaded_at).toLocaleDateString('pt-PT')}
                    </p>
                    <Button
                      onClick={() => {
                        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/client-files/${document.document_url}`
                        window.open(url, '_blank')
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}