'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateUniqueFileName } from '@/lib/fileUtils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Upload, 
  Eye, 
  Image as ImageIcon,
  Car, 
  User, 
  Calendar,
  Euro,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Trash2,
  Edit,
  Video
} from 'lucide-react'

interface Contract {
  id: string
  client_id: string
  car_id: string
  total_amount: number
  down_payment?: number
  financed_amount?: number
  installments?: number
  installment_amount?: number
  contract_type: string
  contract_number: string
  video_url?: string | null
  created_at: string
  cars: {
    id: string
    brand: string
    model: string
    year: number
    license_plate: string
    color: string
    engine: string
    mileage: number
  }
  clients: {
    id: string
    full_name: string
    email: string
    phone?: string
    address?: string
    nif?: string
  }
}

interface Document {
  id: string
  car_id?: string
  client_id?: string
  contract_id?: string
  document_name?: string
  file_name?: string
  document_url?: string
  file_url?: string
  file_path?: string
  document_type?: string
  file_type?: string
  category?: string
  uploaded_at?: string
  created_at?: string
}

interface CarPhoto {
  id: string
  car_id: string
  photo_url?: string
  file_path?: string
  file_name?: string
  uploaded_at?: string
  category?: string
}

export default function ContractViewPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  const [contract, setContract] = useState<Contract | null>(null)
  const [carDocuments, setCarDocuments] = useState<Document[]>([])
  const [clientDocuments, setClientDocuments] = useState<Document[]>([])
  const [contractDocuments, setContractDocuments] = useState<Document[]>([])
  const [carPhotos, setCarPhotos] = useState<CarPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    checkUser()
    if (contractId) {
      fetchContractDetails()
    }
  }, [contractId])

  useEffect(() => {
    // Detectar tema atual
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    
    checkTheme()
    
    // Observar mudanças no tema
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      
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

  const fetchContractDetails = async () => {
    try {
      setLoading(true)

      // Buscar dados do contrato
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          cars (
            id,
            brand,
            model,
            year,
            license_plate,
            color,
            engine,
            mileage
          ),
          clients (
            id,
            full_name,
            email,
            phone,
            address,
            street,
            number,
            city,
            postal_code,
            nationality,
            bank_name,
            iban,
            nif
          )
        `)
        .eq('id', contractId)
        .single()

      if (contractError) throw contractError
      setContract(contractData)

      if (contractData) {
        // Buscar documentos do carro (tabela antiga)
        const { data: oldCarDocs, error: oldCarDocsError } = await supabase
          .from('car_documents')
          .select('*')
          .eq('car_id', contractData.car_id)

        if (!oldCarDocsError && oldCarDocs) {
          setCarDocuments(oldCarDocs)
        }

        // Buscar documentos do cliente (tabela antiga)
        const { data: oldClientDocs, error: oldClientDocsError } = await supabase
          .from('client_documents')
          .select('*')
          .eq('client_id', contractData.client_id)

        if (!oldClientDocsError && oldClientDocs) {
          setClientDocuments(oldClientDocs)
        }

        // Buscar fotos do carro (tabela antiga)
        let oldCarPhotosNormalized: CarPhoto[] = []
        const { data: oldCarPhotos, error: oldCarPhotosError } = await supabase
          .from('car_photos')
          .select('*')
          .eq('car_id', contractData.car_id)

        if (!oldCarPhotosError && oldCarPhotos) {
          oldCarPhotosNormalized = (oldCarPhotos as any[]).map((p: any) => ({
            id: p.id,
            car_id: p.car_id,
            photo_url: p.photo_url,
            file_name: p.photo_name,
            uploaded_at: p.uploaded_at
          }))
        }

        // Buscar documentos na nova estrutura unificada
        const { data: newDocs, error: newDocsError } = await supabase
          .from('documents')
          .select('*')
          .or(`car_id.eq.${contractData.car_id},client_id.eq.${contractData.client_id},contract_id.eq.${contractId}`)

        if (!newDocsError && newDocs) {
          // Separar documentos por categoria
          const newCarDocs = newDocs.filter(doc => doc.car_id === contractData.car_id)
          const newClientDocs = newDocs.filter(doc => doc.client_id === contractData.client_id)
          const newContractDocs = newDocs.filter(doc => doc.contract_id === contractId)

          // Combinar com documentos existentes (evitar duplicatas)
          setCarDocuments(prev => [...prev, ...newCarDocs])
          setClientDocuments(prev => [...prev, ...newClientDocs])
          setContractDocuments(newContractDocs)

          // Mapear fotos do carro na nova estrutura (documents)
          const newCarPhotosMapped: CarPhoto[] = (newDocs as any[])
            .filter((doc: any) => doc.car_id === contractData.car_id && (doc.category === 'car_photo' || (doc.file_type && doc.file_type.startsWith('image/'))))
            .map((doc: any) => ({
              id: doc.id,
              car_id: doc.car_id!,
              photo_url: doc.file_path || doc.file_url,
              file_path: doc.file_path,
              file_name: doc.file_name,
              uploaded_at: doc.created_at,
              category: doc.category
            }))

          setCarPhotos([...oldCarPhotosNormalized, ...newCarPhotosMapped])
        }
      }

    } catch (error) {
      console.error('Erro ao buscar detalhes do contrato:', error)
      alert('Erro ao carregar contrato. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (document: Document) => {
    try {
      console.log('Documento para download:', document) // Debug log
      
      const documentUrl = document.document_url || document.file_path
      const filePath = document.file_path
      
      if (!documentUrl && !filePath) {
        alert('URL do documento não encontrada.')
        return
      }

      // Determinar o bucket correto baseado na URL ou file_path
      let bucketName = 'documents'
      let pathToFile = ''

      if (filePath) {
        // Usar file_path se disponível (nova estrutura)
        // Remover prefixo 'documents/' se presente para evitar duplicação
        pathToFile = filePath.startsWith('documents/') ? filePath.substring('documents/'.length) : filePath
        console.log('[downloadDocument] Nova estrutura detectada. file_path original:', filePath, 'path corrigido:', pathToFile)
      } else if (documentUrl) {
        // Fallback para URL antiga
        if (documentUrl.includes('car-documents')) {
          bucketName = 'car-documents'
          // Extrair car_id e filename da URL antiga
          const urlParts = documentUrl.split('/')
          const carId = urlParts[urlParts.length - 2]
          const filename = urlParts[urlParts.length - 1]
          pathToFile = `${carId}/${filename}`
          console.log('[downloadDocument] Estrutura legada carro. path:', pathToFile)
        } else if (documentUrl.includes('client-files')) {
          // Documentos legados de cliente armazenados no bucket 'client-files'
          bucketName = 'client-files'
          const urlParts = documentUrl.split('/')
          // Encontrar índice do bucket na URL pública e capturar o caminho interno
          const bucketIndex = urlParts.findIndex(part => part === 'client-files')
          if (bucketIndex !== -1) {
            pathToFile = urlParts.slice(bucketIndex + 1).join('/')
          } else {
            // Fallback: usar os dois últimos segmentos como caminho (ex: client-documents/<arquivo>)
            pathToFile = urlParts.slice(-2).join('/')
          }
          console.log('[downloadDocument] Estrutura legada cliente. path:', pathToFile)
        } else if (documentUrl.includes('documents')) {
          bucketName = 'documents'
          // Extrair o caminho do arquivo da nova estrutura
          const urlParts = documentUrl.split('/')
          // Caminhos comuns: contracts/<arquivo> ou <contractId>/<arquivo>
          const bucketIndex = urlParts.findIndex(part => part === 'documents')
          pathToFile = bucketIndex !== -1 ? urlParts.slice(bucketIndex + 1).join('/') : urlParts.slice(-2).join('/')
          console.log('[downloadDocument] URL em documents. path:', pathToFile)
        } else {
          // Tentar extrair o caminho do arquivo da URL
          const urlParts = documentUrl.split('/')
          pathToFile = urlParts.slice(-2).join('/')
          console.log('[downloadDocument] URL desconhecida. path (heurística):', pathToFile)
        }
        console.log('Usando URL, pathToFile:', pathToFile) // Debug log
      }

      console.log('[downloadDocument] Tentando download:', { 
        documentId: document.id,
        bucketName, 
        pathToFile, 
        documentUrl, 
        filePath,
        documentName: document.document_name || document.file_name,
        category: document.category
      })

      // Usar a nova API de download com service_role
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketName,
          filePath: pathToFile
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('[downloadDocument] Erro na API:', result)
        
        const isNotFound = (result.details || '').toLowerCase().includes('object not found')
        const isUnauthorized = (result.details || '').toLowerCase().includes('unauthorized')
        
        if (isNotFound) {
          const msgBase = 'Arquivo não encontrado no servidor.'
          let hint = 'O documento pode ter sido movido ou deletado.'
          
          if (bucketName === 'client-files') {
            hint = 'Documento legado de cliente: verifique se não foi movido ou renomeado.'
          } else if (document.category === 'contract_signed') {
            hint = 'Contrato assinado não encontrado. Verifique se o arquivo foi carregado corretamente.'
          }
          
          alert(`${msgBase} ${hint}\n\nDetalhes técnicos:\nBucket: ${bucketName}\nCaminho: ${pathToFile}`)
        } else if (isUnauthorized) {
          alert('Erro de permissão ao acessar o arquivo. Verifique suas credenciais.')
        } else {
          alert(`Erro ao gerar link de download: ${result.error}\n\nTente novamente mais tarde.`)
        }
        return
      }

      if (result.signedUrl) {
        // Abrir URL assinada em nova aba
        window.open(result.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      alert('Erro ao fazer download do documento.')
    }
  }

  const downloadPhoto = async (photo: CarPhoto) => {
    try {
      const photoUrl = photo.photo_url || photo.file_path
      if (!photoUrl) {
        alert('URL da foto não encontrada.')
        return
      }

      let bucketName = 'car-photos'
      let pathToFile = ''

      if (photoUrl.includes('car-photos')) {
        bucketName = 'car-photos'
        const urlParts = photoUrl.split('/')
        const carId = urlParts[urlParts.length - 2]
        const filename = urlParts[urlParts.length - 1]
        pathToFile = `${carId}/${filename}`
      } else {
        bucketName = 'documents'
        const urlParts = photoUrl.split('/')
        pathToFile = urlParts.slice(-2).join('/')
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(pathToFile, 3600)

      if (error) {
        console.error('Erro ao gerar URL de download da foto:', error)
        alert('Erro ao gerar link de download da foto. Tente novamente.')
        return
      }

      if (data?.signedUrl) {
        // Abrir foto em nova aba
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Erro ao baixar foto:', error)
      alert('Erro ao baixar foto.')
    }
  }

  const handleSignedContractUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !contract) return

    try {
      setUploading(true)

      // Log detalhes do arquivo para diagnóstico
      console.log('📁 Detalhes do arquivo:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        fileObject: typeof file,
        isBlob: file instanceof Blob,
        isFile: file instanceof File
      })

      // Generate unique filename based on client NIF, using the contract folder
      const fileName = await generateUniqueFileName(
        contract.clients.nif || '',
        'contrato-venda', // Using same type as it's still a contract
        'documents', // bucket name
        contractId // folder path - use contract ID as folder
      )
      const filePath = `${contractId}/${fileName}`

      console.log('📂 Caminho do upload:', {
        bucket: 'documents',
        filePath: filePath,
        fileName: fileName,
        contractId: contractId
      })

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

       if (uploadError) {
         console.error('❌ Erro no upload do Supabase Storage:', {
           message: uploadError.message,
           error: uploadError,
           fullError: JSON.stringify(uploadError, null, 2)
         })
         throw uploadError
       }

      console.log('✅ Upload realizado com sucesso')

      // Salvar referência no banco
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          contract_id: contractId,
          document_type: 'contrato',
          file_name: fileName,
          file_path: filePath, // Just the path within the bucket: contractId/filename
          file_size: file.size,
          mime_type: file.type,
          category: 'contract_signed'
        })

      if (dbError) {
        console.error('❌ Erro ao salvar no banco de dados:', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
          error: dbError,
          fullError: JSON.stringify(dbError, null, 2)
        })
        throw dbError
      }

      console.log('✅ Referência salva no banco com sucesso')
      alert('Contrato assinado carregado com sucesso!')
      fetchContractDetails() // Recarregar documentos

    } catch (error: any) {
      console.error('❌ Erro completo no upload:', {
        message: error?.message || 'Erro desconhecido',
        name: error?.name,
        code: error?.code,
        statusCode: error?.statusCode,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        response: error?.response?.data,
        fullError: JSON.stringify(error, null, 2),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      alert(`Erro ao carregar contrato assinado: ${error?.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`)
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (document: Document) => {
    if (!confirm('Tem certeza que deseja deletar este documento?')) return

    try {
      const documentUrl = document.document_url || document.file_path
      if (!documentUrl) return

      // Determinar o bucket e caminho
      let bucketName = 'documents'
      let filePath = ''

      if (documentUrl.includes('car-documents')) {
        bucketName = 'car-documents'
        const urlParts = documentUrl.split('/')
        const carId = urlParts[urlParts.length - 2]
        const filename = urlParts[urlParts.length - 1]
        filePath = `${carId}/${filename}`
      } else {
        const urlParts = documentUrl.split('/')
        filePath = urlParts.slice(-2).join('/')
      }

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (storageError) {
        console.error('Erro ao deletar do storage:', storageError)
      }

      // Deletar do banco de dados
      if (document.car_id) {
        await supabase.from('car_documents').delete().eq('id', document.id)
      } else if (document.client_id) {
        await supabase.from('client_documents').delete().eq('id', document.id)
      } else if (document.contract_id) {
        await supabase.from('documents').delete().eq('id', document.id)
      }

      alert('Documento deletado com sucesso!')
      fetchContractDetails()

    } catch (error) {
      console.error('Erro ao deletar documento:', error)
      alert('Erro ao deletar documento.')
    }
  }

  const deletePhoto = async (photo: CarPhoto) => {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) return

    try {
      const photoUrl = photo.photo_url || photo.file_path
      if (!photoUrl) return

      let bucketName = 'car-photos'
      let filePath = ''

      if (photoUrl.includes('car-photos')) {
        bucketName = 'car-photos'
        const urlParts = photoUrl.split('/')
        const carId = urlParts[urlParts.length - 2]
        const filename = urlParts[urlParts.length - 1]
        filePath = `${carId}/${filename}`
      } else {
        bucketName = 'documents'
        const urlParts = photoUrl.split('/')
        filePath = urlParts.slice(-2).join('/')
      }

      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (storageError) {
        console.error('Erro ao deletar foto do storage:', storageError)
      }

      // Excluir do banco de dados conforme a origem
      if (photoUrl.includes('car-photos')) {
        await supabase.from('car_photos').delete().eq('id', photo.id)
      } else {
        await supabase.from('documents').delete().eq('id', photo.id)
      }

      alert('Foto deletada com sucesso!')
      fetchContractDetails()

    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      alert('Erro ao deletar foto.')
    }
  }

  const handleDeleteContract = async () => {
    if (!contract) return

    console.log('Botão de exclusão clicado')

    try {
      // Confirmação dupla para evitar exclusões acidentais
      const confirmFirst = window.confirm(
        `Tem certeza que deseja excluir o contrato #${contract.contract_number}?\n\nEsta ação irá:\n- Excluir o contrato permanentemente\n- Excluir todos os documentos associados\n- Liberar o carro para venda novamente\n\nEsta ação não pode ser desfeita.`
      )
      
      console.log('Primeira confirmação:', confirmFirst)
      if (!confirmFirst) {
        console.log('Primeira confirmação cancelada')
        return
      }

      const confirmSecond = window.confirm(
        'CONFIRMAÇÃO FINAL: Esta ação é irreversível. Deseja realmente continuar?'
      )
      
      console.log('Segunda confirmação:', confirmSecond)
      if (!confirmSecond) {
        console.log('Segunda confirmação cancelada')
        return
      }

      console.log('Ambas confirmações aceitas, prosseguindo com exclusão')
    } catch (confirmError) {
      console.error('Erro nas confirmações:', confirmError)
      return
    }

    try {
      setLoading(true)
      console.log('Iniciando exclusão do contrato:', contract.id)

      // 1. Excluir todos os documentos associados ao contrato
      console.log('Buscando documentos do contrato...')
      const { data: contractDocuments, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('contract_id', contract.id)

      if (documentsError) {
        console.error('Erro ao buscar documentos:', documentsError)
        throw documentsError
      }

      console.log('Documentos encontrados:', contractDocuments?.length || 0)

      if (contractDocuments && contractDocuments.length > 0) {
        console.log('Excluindo documentos do storage...')
        for (const doc of contractDocuments) {
          try {
            // Excluir do storage
            if (doc.file_path) {
              console.log('Excluindo arquivo:', doc.file_path)
              const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([doc.file_path])
              
              if (storageError) {
                console.error('Erro ao excluir do storage:', storageError)
              }
            }
          } catch (error) {
            console.error('Erro ao excluir documento do storage:', error)
          }
        }

        // Excluir registros dos documentos do banco
        console.log('Excluindo registros de documentos do banco...')
        const { error: deleteDocsError } = await supabase
          .from('documents')
          .delete()
          .eq('contract_id', contract.id)

        if (deleteDocsError) {
          console.error('Erro ao excluir documentos do banco:', deleteDocsError)
          throw deleteDocsError
        }
      }

      // 2. Atualizar status do carro para 'disponivel'
      console.log('Atualizando status do carro para disponivel...')
      console.log('Car ID do contrato:', contract.car_id)
      
      if (!contract.car_id) {
        console.error('Car ID não encontrado no contrato')
        throw new Error('ID do carro não encontrado no contrato')
      }

      const { error: carUpdateError } = await supabase
        .from('cars')
        .update({ status: 'disponivel' })
        .eq('id', contract.car_id)

      if (carUpdateError) {
        console.error('Erro ao atualizar status do carro:', carUpdateError)
        throw carUpdateError
      }
      console.log('Status do carro atualizado com sucesso')

      // 3. Excluir o contrato
      console.log('Excluindo contrato...')
      const { error: contractDeleteError } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id)

      if (contractDeleteError) {
        console.error('Erro ao excluir contrato:', contractDeleteError)
        throw contractDeleteError
      }

      console.log('Contrato excluído com sucesso!')
      alert('Contrato excluído com sucesso! O carro foi liberado para venda novamente.')
      router.push('/dashboard/contracts')

    } catch (error) {
      console.error('Erro geral ao excluir contrato:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`Erro ao excluir contrato: ${errorMessage}. Tente novamente.`)
    } finally {
      setLoading(false)
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

  if (!contract) {
    return (
      <DashboardLayout
        onLogout={handleLogout}
        userRole={profile?.role}
        userName={profile?.full_name || user?.email || ''}
        userEmail={user?.email || ''}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Contrato não encontrado
            </h2>
            <Button onClick={() => router.push('/dashboard/contracts')}>
              Voltar aos Contratos
            </Button>
          </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/contracts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Contrato #{contract.contract_number}
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Visualização completa do contrato e documentos
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/dashboard/contracts/edit/${contract.id}`)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit className="h-4 w-4" />
            Alterar Informações
          </button>
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDeleteContract()
            }}
            type="button"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Contrato
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Número do Contrato
                  </label>
                  <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                    #{contract.contract_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Data de Criação
                  </label>
                  <p className="text-text-primary-light dark:text-text-primary-dark">
                    {new Date(contract.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Valor Total
                </label>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  €{contract.total_amount?.toLocaleString()}
                </p>
              </div>

              {contract.down_payment && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      Entrada
                    </label>
                    <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                      €{contract.down_payment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      Financiado
                    </label>
                    <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                      €{contract.financed_amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Nome Completo
                </label>
                <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                  {contract.clients.full_name}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                  <span className="text-text-primary-light dark:text-text-primary-dark">
                    {contract.clients.email}
                  </span>
                </div>
                
                {contract.clients.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                    <span className="text-text-primary-light dark:text-text-primary-dark">
                      {contract.clients.phone}
                    </span>
                  </div>
                )}
                
                {contract.clients.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                    <span className="text-text-primary-light dark:text-text-primary-dark">
                      {typeof contract.clients.address === 'string' 
                        ? (() => {
                            try {
                              const addr = JSON.parse(contract.clients.address)
                              return `${addr.street || ''} ${addr.number || ''}, ${addr.city || ''}`
                            } catch {
                              return contract.clients.address
                            }
                          })()
                        : contract.clients.address
                      }
                    </span>
                  </div>
                )}
                
                {contract.clients.nif && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                    <span className="text-text-primary-light dark:text-text-primary-dark">
                      NIF: {contract.clients.nif}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Carro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Veículo
                </label>
                <p className="text-text-primary-light dark:text-text-primary-dark font-semibold text-lg">
                  {contract.cars.brand} {contract.cars.model} ({contract.cars.year})
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Matrícula
                  </label>
                  <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                    {contract.cars.license_plate}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Cor
                  </label>
                  <p className="text-text-primary-light dark:text-text-primary-dark">
                    {contract.cars.color}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Motor
                  </label>
                  <p className="text-text-primary-light dark:text-text-primary-dark">
                    {contract.cars.engine}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Quilometragem
                  </label>
                  <p className="text-text-primary-light dark:text-text-primary-dark">
                    {contract.cars.mileage?.toLocaleString()} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contrato e Confissão de Dívida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contrato e Confissão de Dívida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Contrato Sem Assinar */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Contrato Sem Assinar
                </h3>
                
                {contractDocuments.filter(doc => 
                  doc.category !== 'contract_signed' && 
                  (doc.file_name?.toLowerCase().includes('contrato') || doc.file_name?.toLowerCase().includes('confissao'))
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contractDocuments
                      .filter(doc => 
                        doc.category !== 'contract_signed' && 
                        (doc.file_name?.toLowerCase().includes('contrato') || doc.file_name?.toLowerCase().includes('confissao'))
                      )
                      .map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-4 rounded-lg border-2 shadow-sm min-h-[100px]" 
                          style={{
                            backgroundColor: isDarkMode ? '#1f2937' : 'white',
                            borderColor: '#f97316'
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-base text-orange-500 dark:text-orange-300 block font-bold break-words">
                                {doc.file_name}
                              </span>
                              <span className="text-sm text-orange-500 dark:text-orange-400 font-semibold">
                                {doc.category || 'Documento'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3 flex-shrink-0 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadDocument(doc)}
                              className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 p-2"
                            >
                              <Download className="h-5 w-5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDocument(doc)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm italic">
                    Nenhum contrato sem assinar encontrado
                  </p>
                )}
              </div>

              {/* Contrato Assinado */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Contrato Assinado
                </h3>
                
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-4">
                  Faça upload do contrato assinado pelo cliente
                </p>
                
                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleSignedContractUpload}
                    className="hidden"
                    id="signed-contract-upload"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('signed-contract-upload')?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Carregando...' : 'Carregar Contrato Assinado'}
                  </Button>
                </div>
                
                {contractDocuments.filter(doc => doc.category === 'contract_signed').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contractDocuments
                      .filter(doc => doc.category === 'contract_signed')
                      .map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-4 rounded-lg border-2 shadow-sm min-h-[100px]" 
                          style={{
                            backgroundColor: isDarkMode ? '#1f2937' : 'white',
                            borderColor: '#22c55e'
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-base text-green-500 dark:text-green-300 block font-bold break-words">
                                {doc.file_name}
                              </span>
                              <span className="text-sm text-green-500 dark:text-green-400 font-semibold">
                                Contrato Assinado
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3 flex-shrink-0 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadDocument(doc)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2"
                            >
                              <Download className="h-5 w-5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDocument(doc)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm italic">
                    Nenhum contrato assinado carregado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fotos do Carro */}
        {carPhotos && carPhotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Fotos do Carro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carPhotos.map((photo) => (
                  <div key={photo.id} className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <div>
                        <span className="text-sm text-teal-700 dark:text-teal-300 block">
                          {photo.file_name || photo.photo_url?.split('/').pop()}
                        </span>
                        <span className="text-xs text-teal-600 dark:text-teal-400">
                          {photo.category || 'Foto do Carro'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadPhoto(photo)}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePhoto(photo)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos do Carro */}
        {carDocuments.filter(doc => 
          !doc.file_name?.toLowerCase().includes('contrato') && 
          !doc.file_name?.toLowerCase().includes('confissao')
        ).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Documentos do Carro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carDocuments
                  .filter(doc => 
                    !doc.file_name?.toLowerCase().includes('contrato') && 
                    !doc.file_name?.toLowerCase().includes('confissao')
                  )
                  .map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 rounded-lg border-2 shadow-sm" 
                      style={{
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderColor: '#3b82f6'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <span className="text-sm text-blue-500 dark:text-blue-300 block font-bold">
                            {doc.document_name || doc.file_name}
                          </span>
                          <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">
                            {doc.document_type || doc.file_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDocument(doc)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDocument(doc)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos do Cliente */}
        {clientDocuments.filter(doc => 
          !doc.file_name?.toLowerCase().includes('contrato') && 
          !doc.file_name?.toLowerCase().includes('confissao')
        ).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Documentos do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientDocuments
                  .filter(doc => 
                    !doc.file_name?.toLowerCase().includes('contrato') && 
                    !doc.file_name?.toLowerCase().includes('confissao')
                  )
                  .map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 rounded-lg border-2 shadow-sm" 
                      style={{
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderColor: '#8b5cf6'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <div>
                          <span className="text-sm text-purple-500 dark:text-purple-300 block font-bold">
                            {doc.document_name || doc.file_name}
                          </span>
                          <span className="text-xs text-purple-500 dark:text-purple-400 font-semibold">
                            {doc.document_type || doc.file_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDocument(doc)}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDocument(doc)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Outros Documentos do Contrato */}
        {contractDocuments.filter(doc => 
          doc.category !== 'contract_signed' && 
          !doc.file_name?.toLowerCase().includes('contrato') && 
          !doc.file_name?.toLowerCase().includes('confissao')
        ).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Outros Documentos do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractDocuments
                  .filter(doc => 
                    doc.category !== 'contract_signed' && 
                    !doc.file_name?.toLowerCase().includes('contrato') && 
                    !doc.file_name?.toLowerCase().includes('confissao')
                  )
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 block">
                            {doc.file_name}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {doc.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDocument(doc)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDocument(doc)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vídeo do Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Vídeo do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract?.video_url ? (
              <div className="space-y-4">
                <video
                  src={contract.video_url}
                  controls
                  className="w-full rounded-lg border border-border-light dark:border-border-dark"
                >
                  Seu navegador não suporta a reprodução de vídeo.
                </video>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Vídeo da assinatura do contrato
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = contract.video_url!
                      link.download = `video-contrato-${contract.contract_number}.mp4`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Vídeo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
                <Video className="h-16 w-16 text-text-secondary-light dark:text-text-secondary-dark mb-4" />
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  Nenhum vídeo associado a este contrato
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}