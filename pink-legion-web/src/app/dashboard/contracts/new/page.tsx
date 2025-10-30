'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ContractVideoUpload } from '@/components/ui/ContractVideoUpload'
import { ArrowLeft, Car, User, Calculator, Download, Video } from 'lucide-react'
// Removendo gerador antigo baseado em jsPDF; utilizando API server-side
import { generateUniqueFileName } from '@/lib/fileUtils'

// Label component
const Label = ({ htmlFor, children, className }: { htmlFor?: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium mb-2 ${className || ''}`}>
    {children}
  </label>
)

// Simple Select components (using native HTML select)
const Select = ({ children, onValueChange, value, className }: { 
  children: React.ReactNode, 
  onValueChange: (value: string) => void,
  value?: string,
  className?: string 
}) => {
  return (
    <select 
      value={value || ''} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className || ''}`}
    >
      {children}
    </select>
  )
}

const SelectValue = ({ placeholder }: { placeholder: string }) => (
  <option value="" disabled>{placeholder}</option>
)

const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

const SelectItem = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <option value={value} className="text-text-primary-light dark:text-text-primary-dark">
    {children}
  </option>
)

interface Car {
  id: string
  brand: string
  model: string
  year: number
  license_plate: string
  vin?: string
  purchase_price?: number
  sale_price?: number
}

interface Client {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  street?: string
  number?: string
  city?: string
  postal_code?: string
  nif?: string
}

interface ContractData {
  client: {
    name: string
    email: string
    phone: string
    address: string
    nif: string
  }
  car: {
    brand: string
    model: string
    year: number
    licensePlate: string
    vin?: string
  }
  salePrice: number
  paymentMethod: string
  observations: string
  includeDebtConfession: boolean
}

  interface LibContractData {
    car: {
      id: string
      brand: string
      model: string
      year: number
      license_plate: string
      vin?: string
      engine: string
      color: string
      mileage: number
    }
    client: {
      id: string
      full_name: string
      email: string
      phone: string
      address: string
      city: string
      postal_code: string
      country: string
      nationality?: string
      bank_name?: string
      iban?: string
      swift?: string
      id_number: string
      nif: string
    }
    contract: {
      total_price: number
      down_payment: number
      financed_amount: number
      installments: number
      installment_amount: number
      contract_date: string
      delivery_date: string
      first_payment_date?: string
      contract_number?: string
      notes?: string
    }
  }

export default function NewContractPage() {
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCarId, setSelectedCarId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Form data
  const [salePrice, setSalePrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [observations, setObservations] = useState('')
  const [includeDebtConfession, setIncludeDebtConfession] = useState(false)
  const [firstPaymentDate, setFirstPaymentDate] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  
  // Campos para cálculo de parcelas
  const [downPayment, setDownPayment] = useState('')
  const [numberOfInstallments, setNumberOfInstallments] = useState('')
  const [installmentValue, setInstallmentValue] = useState('')

  useEffect(() => {
    checkUser()
    fetchData()
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

  // Função para calcular automaticamente o valor das parcelas
  useEffect(() => {
    if (salePrice && downPayment && numberOfInstallments) {
      const total = parseFloat(salePrice) || 0
      const down = parseFloat(downPayment) || 0
      const installments = parseInt(numberOfInstallments) || 0
      
      if (installments > 0) {
        const remainingAmount = total - down
        const calculatedInstallmentValue = remainingAmount / installments
        setInstallmentValue(calculatedInstallmentValue.toFixed(2))
      }
    } else {
      setInstallmentValue('')
    }
  }, [salePrice, downPayment, numberOfInstallments])

  const fetchData = async () => {
    try {
      // Fetch available cars
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .eq('status', 'disponivel')

      if (carsError) {
        console.error('Error fetching cars:', carsError)
      } else {
        setCars(carsData || [])
      }

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('full_name')

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      } else {
        setClients(clientsData || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCarSelect = (carId: string) => {
    setSelectedCarId(carId)
    const car = cars.find(c => c.id === carId)
    setSelectedCar(car || null)
    if (car?.sale_price) {
      setSalePrice(car.sale_price.toString())
    } else {
      setSalePrice('')
    }
  }

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    const client = clients.find(c => c.id === clientId)
    setSelectedClient(client || null)
  }

  const handleGenerateContract = async () => {
    if (!selectedCar || !selectedClient || !salePrice) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      // Generate unique contract number based on NIF
      const generateUniqueContractNumber = async (baseNif: string): Promise<string> => {
        let contractNumber = baseNif
        let suffix = 1
        
        while (true) {
          // Check if contract number already exists
          const { data: existingContract } = await supabase
            .from('contracts')
            .select('id')
            .eq('contract_number', contractNumber)
            .single()
          
          if (!existingContract) {
            // Contract number is unique
            return contractNumber
          }
          
          // Contract number exists, try with suffix
          suffix++
          contractNumber = `${baseNif}-${suffix}`
        }
      }

      const uniqueContractNumber = await generateUniqueContractNumber(
        selectedClient.nif || `CONT-${Date.now()}`
      )

      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Create contract record in database
      const contractData = {
        client_id: selectedClient.id,
        car_id: selectedCar.id,
        total_amount: parseFloat(salePrice),
        down_payment: parseFloat(downPayment) || 0,
        financed_amount: parseFloat(salePrice) - (parseFloat(downPayment) || 0),
        installments: parseInt(numberOfInstallments) || 0,
        installment_amount: parseFloat(installmentValue) || 0,
        contract_type: 'venda',
        contract_number: uniqueContractNumber,
        status: 'ativo', // ✅ Adicionando campo status explicitamente
        contract_date: new Date().toISOString().split('T')[0], // ✅ Formato DATE correto (YYYY-MM-DD)
        first_payment_date: firstPaymentDate || null,
        video_url: videoUrl,
        created_by: user.id // ✅ Adicionando created_by
      }

      // 🔍 LOG PAYLOAD ANTES DO INSERT
      console.log('📋 PAYLOAD CONTRATO ENVIADO:', JSON.stringify(contractData, null, 2))
      console.log('📋 DADOS SELECIONADOS:', {
        client: selectedClient,
        car: selectedCar,
        salePrice,
        downPayment,
        numberOfInstallments,
        installmentValue
      })

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single()

      if (error) {
        // 🚨 LOGGING DETALHADO DO ERRO
        console.error('❌ ERRO CRIANDO CONTRATO:')
        console.error('📄 Error message:', error.message)
        console.error('📄 Error details:', JSON.stringify(error, null, 2))
        console.error('📄 Error code:', error.code)
        console.error('📄 Error hint:', error.hint)
        console.error('📄 Error details:', error.details)
        alert(`Erro ao criar contrato: ${error.message}. Tente novamente.`)
        return
      }

      // Generate installments for the contract
      await generateInstallmentsForContract(contract.id, contractData)

      // Generate PDFs with contract ID
      await generateContractPDFs({
        ...contractData,
        contract_id: contract.id
      })

      alert('Contrato gerado com sucesso!')
      
      // Redirect to the specific contract page where PDFs can be viewed
      router.push(`/dashboard/contracts/${contract.id}`)

    } catch (error) {
      // 🚨 LOGGING DETALHADO DO ERRO PRINCIPAL
      console.error('❌ ERRO GERAL CRIANDO CONTRATO:')
      console.error('📄 Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('📄 Error stack:', error instanceof Error ? error.stack : undefined)
      console.error('📄 Full error object:', JSON.stringify(error, null, 2))
      console.error('📄 Error type:', typeof error)
      console.error('📄 Error constructor:', error?.constructor?.name)
      
      // Se for um erro do Supabase, log detalhes específicos
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('📄 Supabase error code:', (error as any).code)
        console.error('📄 Supabase error hint:', (error as any).hint)
        console.error('📄 Supabase error details:', (error as any).details)
      }
      
      alert(`Erro ao gerar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`)
    }
  }

  // Function to generate installments for a contract
  const generateInstallmentsForContract = async (contractId: string, contractData: any) => {
    try {
      // Calculate first payment date: use provided date or default to 30 days from today
      const baseFirstPaymentDate = contractData?.first_payment_date
        ? new Date(contractData.first_payment_date)
        : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })()

      // Delete existing payments for this contract (if any)
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('contract_id', contractId)

      if (deleteError) {
        console.error('Error deleting existing payments:', deleteError)
        throw deleteError
      }

      // Generate new installments
      const installments = []
      const installmentAmount = parseFloat(installmentValue) || (parseFloat(salePrice) - (parseFloat(downPayment) || 0)) / (parseInt(numberOfInstallments) || 1)
      
      for (let i = 1; i <= (parseInt(numberOfInstallments) || 1); i++) {
        const dueDate = new Date(baseFirstPaymentDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))

        installments.push({
          contract_id: contractId,
          installment_number: i,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente'
        })
      }

      // Insert new installments
      const { error: insertError } = await supabase
        .from('payments')
        .insert(installments)

      if (insertError) {
        console.error('Error inserting installments:', insertError)
        throw insertError
      }

      console.log(`Generated ${installments.length} installments for contract ${contractId}`)
    } catch (error) {
      console.error('Error generating installments:', error)
      throw error
    }
  }

  const generateContractPDFs = async (data: any) => {
    try {
      // Validação de dados obrigatórios
      if (!selectedClient) {
        throw new Error('Cliente não selecionado')
      }
      if (!selectedCar) {
        throw new Error('Veículo não selecionado')
      }
      if (!salePrice || isNaN(parseFloat(salePrice))) {
        throw new Error('Preço de venda inválido')
      }

      // Validação de dados do cliente
      if (!selectedClient.full_name?.trim()) {
        throw new Error('Nome do cliente é obrigatório')
      }
      if (!selectedClient.email?.trim()) {
        throw new Error('Email do cliente é obrigatório')
      }

      // Validação de dados do veículo
      if (!selectedCar.brand?.trim()) {
        throw new Error('Marca do veículo é obrigatória')
      }
      if (!selectedCar.model?.trim()) {
        throw new Error('Modelo do veículo é obrigatório')
      }
      if (!selectedCar.license_plate?.trim()) {
        throw new Error('Matrícula do veículo é obrigatória')
      }

      // 🔍 DEBUG - Log dos dados do cliente selecionado
      console.log('🔍 DEBUG - Dados do Cliente Selecionado:', {
        id: selectedClient.id,
        full_name: selectedClient.full_name,
        street: selectedClient.street,
        number: selectedClient.number,
        city: selectedClient.city,
        postal_code: selectedClient.postal_code,
        address_raw: selectedClient.address
      })

      const libContractData: LibContractData = {
        client: {
          id: selectedClient.id,
          full_name: selectedClient.full_name.trim(),
          email: selectedClient.email.trim(),
          phone: selectedClient.phone?.trim() || '',
          address: (() => {
            // Priorizar campos separados
            if (selectedClient.street) {
              const parts = [selectedClient.street]
              if (selectedClient.number) parts.push(selectedClient.number)
              // Tentar pegar complemento do JSON se existir
              if (selectedClient.address && typeof selectedClient.address === 'string') {
                try {
                  const addr = JSON.parse(selectedClient.address)
                  if (addr.complement) parts.push(addr.complement)
                } catch {}
              }
              return parts.join(', ').trim()
            }
            
            // Fallback: ler tudo do JSON
            if (selectedClient.address && typeof selectedClient.address === 'string') {
              try {
                const addr = JSON.parse(selectedClient.address)
                const parts = []
                if (addr.street) parts.push(addr.street)
                if (addr.number) parts.push(addr.number)
                if (addr.complement) parts.push(addr.complement)
                return parts.join(', ').trim()
              } catch {
                return selectedClient.address.trim()
              }
            }
            return ''
          })(),
          city: (() => {
            // Priorizar campo separado city
            if (selectedClient.city) {
              return selectedClient.city
            }
            
            // Fallback: tentar ler do campo address antigo
            if (!selectedClient.address) return ''
            
            // Check if address is stored as JSON to extract city
            if (typeof selectedClient.address === 'string') {
              try {
                const addr = JSON.parse(selectedClient.address)
                return addr.city || ''
              } catch {
                return ''
              }
            }
            return ''
          })(),
          postal_code: (() => {
            // Priorizar campo separado postal_code
            if (selectedClient.postal_code) {
              return selectedClient.postal_code
            }
            
            // Fallback: tentar ler do campo address antigo
            if (!selectedClient.address) return ''
            
            // Check if address is stored as JSON to extract postal code
            if (typeof selectedClient.address === 'string') {
              try {
                const addr = JSON.parse(selectedClient.address)
                return addr.postal_code || ''
              } catch {
                return ''
              }
            }
            return ''
          })(),
          country: 'Portugal',
          nationality: (selectedClient as any).nationality || 'Portugal',
          bank_name: (selectedClient as any).bank_name || '',
          iban: (selectedClient as any).iban || '',
          swift: (selectedClient as any).swift || (selectedClient as any).bic || '',
          id_number: '',
          nif: selectedClient.nif?.trim() || ''
        },
        car: {
          id: data.car_id,
          brand: selectedCar.brand.trim(),
          model: selectedCar.model.trim(),
          year: selectedCar.year || new Date().getFullYear(),
          license_plate: selectedCar.license_plate.trim(),
          vin: selectedCar.vin?.trim() || '',
          engine: '',
          color: '',
          mileage: 0
        },
        contract: {
          total_price: parseFloat(salePrice),
          down_payment: parseFloat(downPayment) || 0,
          financed_amount: parseFloat(salePrice) - (parseFloat(downPayment) || 0),
          installments: parseInt(numberOfInstallments) || 1,
          installment_amount: parseFloat(installmentValue) || parseFloat(salePrice),
          contract_date: new Date().toISOString().split('T')[0],
          delivery_date: new Date().toISOString().split('T')[0],
          first_payment_date: firstPaymentDate || undefined,
          contract_number: data.contract_number,
          notes: observations?.trim() || ''
        }
      }

      // 🔍 DEBUG - Log do LibContractData montado
      console.log('🔍 DEBUG - LibContractData montado:', libContractData.client)

      // Gerar PDF via endpoint server-side (Puppeteer)
      const saleResp = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sale', data: libContractData })
      })
      if (!saleResp.ok) {
        const errText = await saleResp.text()
        throw new Error(`Falha ao gerar contrato: ${errText}`)
      }
      const saleContractArrayBuffer = await saleResp.arrayBuffer()
      const saleContractBlob = new Blob([saleContractArrayBuffer], { type: 'application/pdf' })
      
      // Generate unique filename based on client NIF
      const saleContractFileName = await generateUniqueFileName(
        selectedClient.nif || '',
        'contrato-venda'
      )
      
      // Upload sale contract to Supabase Storage
      const { data: saleUploadData, error: saleUploadError } = await supabase.storage
        .from('documents')
        .upload(`contracts/${saleContractFileName}`, saleContractBlob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (saleUploadError) {
        console.error('Error uploading sale contract:', saleUploadError)
        throw new Error('Erro ao salvar contrato de venda')
      }

      // Get current user for uploaded_by field
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Create document record for sale contract
      const saleDocumentData = {
        contract_id: data.contract_id,
        client_id: selectedClient.id,
        car_id: selectedCar.id,
        document_type: 'contrato', // ✅ Valor válido conforme constraint CHECK
        file_name: saleContractFileName, // ✅ Campo NOT NULL obrigatório
        file_path: saleUploadData.path, // ✅ Campo NOT NULL obrigatório
        uploaded_by: user.id
      }

      // 🔍 LOG PAYLOAD ANTES DO INSERT - DOCUMENTO VENDA
      console.log('📋 PAYLOAD DOCUMENTO VENDA ENVIADO:', JSON.stringify(saleDocumentData, null, 2))

      const { error: saleDocError } = await supabase
        .from('documents')
        .insert(saleDocumentData)

      if (saleDocError) {
        // 🚨 LOGGING DETALHADO DO ERRO - DOCUMENTO VENDA
        console.error('❌ ERRO CRIANDO DOCUMENTO VENDA:')
        console.error('📄 Error message:', saleDocError.message)
        console.error('📄 Error details:', JSON.stringify(saleDocError, null, 2))
        console.error('📄 Error code:', saleDocError.code)
        console.error('📄 Error hint:', saleDocError.hint)
        console.error('📄 Error details:', saleDocError.details)
        throw new Error(`Erro ao criar registro do contrato de venda: ${saleDocError.message}`)
      }

      // Gerar confissão de dívida se necessário
      if (includeDebtConfession) {
        const debtResp = await fetch('/api/generate-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'debt_confession', data: libContractData })
        })
        if (!debtResp.ok) {
          const errText = await debtResp.text()
          throw new Error(`Falha ao gerar confissão de dívida: ${errText}`)
        }
        const debtArrayBuffer = await debtResp.arrayBuffer()
        const debtConfessionBlob = new Blob([debtArrayBuffer], { type: 'application/pdf' })
        
        // Generate unique filename based on client NIF
        const debtConfessionFileName = await generateUniqueFileName(
          selectedClient.nif || '',
          'confissao-divida'
        )
        
        // Upload debt confession to Supabase Storage
        const { data: debtUploadData, error: debtUploadError } = await supabase.storage
          .from('documents')
          .upload(`contracts/${debtConfessionFileName}`, debtConfessionBlob, {
            contentType: 'application/pdf',
            upsert: false
          })

        if (debtUploadError) {
          console.error('Error uploading debt confession:', debtUploadError)
          throw new Error('Erro ao salvar confissão de dívida')
        }

        // Create document record for debt confession
        const debtDocumentData = {
          contract_id: data.contract_id,
          client_id: selectedClient.id,
          car_id: selectedCar.id,
          document_type: 'contrato', // ✅ Valor válido conforme constraint CHECK
          file_name: debtConfessionFileName, // ✅ Campo NOT NULL obrigatório
          file_path: debtUploadData.path, // ✅ Campo NOT NULL obrigatório
          uploaded_by: user.id
        }

        // 🔍 LOG PAYLOAD ANTES DO INSERT - DOCUMENTO DÍVIDA
        console.log('📋 PAYLOAD DOCUMENTO DÍVIDA ENVIADO:', JSON.stringify(debtDocumentData, null, 2))

        const { error: debtDocError } = await supabase
          .from('documents')
          .insert(debtDocumentData)

        if (debtDocError) {
          // 🚨 LOGGING DETALHADO DO ERRO - DOCUMENTO DÍVIDA
          console.error('❌ ERRO CRIANDO DOCUMENTO DÍVIDA:')
          console.error('📄 Error message:', debtDocError.message)
          console.error('📄 Error details:', JSON.stringify(debtDocError, null, 2))
          console.error('📄 Error code:', debtDocError.code)
          console.error('📄 Error hint:', debtDocError.hint)
          console.error('📄 Error details:', debtDocError.details)
          throw new Error(`Erro ao criar registro da confissão de dívida: ${debtDocError.message}`)
        }
      }

      // Opcional: disponibilizar links de download via Storage/UI, sem usar jsPDF

    } catch (error) {
      console.error('Error generating PDFs:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      throw error // Re-throw para que o erro seja capturado pela função pai
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

  return (
    <DashboardLayout
      onLogout={handleLogout}
      userRole={profile?.role}
      userName={profile?.full_name || user?.email || ''}
      userEmail={user?.email || ''}
    >
      <div className="space-y-6">
        {/* Header */}
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
              Gerar Novo Contrato
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Crie um novo contrato de compra e venda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seleção de Carro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
                <Car className="h-5 w-5" />
                Selecionar Carro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="car-select" className="text-text-primary-light dark:text-text-primary-dark">
                  Carro Disponível
                </Label>
                <Select onValueChange={handleCarSelect} value={selectedCarId}>
                  <SelectValue placeholder="Selecione um carro..." />
                  <SelectContent>
                    {cars.map((car) => (
                      <SelectItem 
                        key={car.id} 
                        value={car.id}
                      >
                        {car.brand} {car.model} ({car.year}) - {car.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCar && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                    Detalhes do Carro
                  </h4>
                  <div className="space-y-1 text-sm text-primary-800 dark:text-primary-200">
                    <p><strong>Marca:</strong> {selectedCar.brand}</p>
                    <p><strong>Modelo:</strong> {selectedCar.model}</p>
                    <p><strong>Ano:</strong> {selectedCar.year}</p>
                    <p><strong>Matrícula:</strong> {selectedCar.license_plate}</p>
                    {selectedCar.vin && <p><strong>VIN:</strong> {selectedCar.vin}</p>}
                    {selectedCar.sale_price && (
                      <p><strong>Preço de Venda:</strong> €{(selectedCar.sale_price || 0).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
                <User className="h-5 w-5" />
                Selecionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client-select" className="text-text-primary-light dark:text-text-primary-dark">
                  Cliente
                </Label>
                <Select onValueChange={handleClientSelect} value={selectedClientId}>
                  <SelectValue placeholder="Selecione um cliente..." />
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id}
                      >
                        {client.full_name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <h4 className="font-medium text-success-900 dark:text-success-100 mb-2">
                    Detalhes do Cliente
                  </h4>
                  <div className="space-y-1 text-sm text-success-800 dark:text-success-200">
                    <p><strong>Nome:</strong> {selectedClient.full_name}</p>
                    <p><strong>Email:</strong> {selectedClient.email}</p>
                    {selectedClient.phone && <p><strong>Telefone:</strong> {selectedClient.phone}</p>}
                    {(selectedClient.street || selectedClient.address) && (
                      <p><strong>Morada:</strong> {
                        selectedClient.street 
                          ? `${selectedClient.street}${selectedClient.number ? ', ' + selectedClient.number : ''}, ${selectedClient.city || ''} ${selectedClient.postal_code || ''}`.trim()
                          : (typeof selectedClient.address === 'string' 
                              ? (() => {
                                  try {
                                    const addr = JSON.parse(selectedClient.address)
                                    return `${addr.street || ''} ${addr.number || ''}, ${addr.city || ''}`
                                  } catch {
                                    return selectedClient.address
                                  }
                                })()
                              : selectedClient.address)
                      }</p>
                    )}
                    {selectedClient.nif && <p><strong>NIF:</strong> {selectedClient.nif}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
              <Calculator className="h-5 w-5" />
              Detalhes do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="sale-price" className="text-text-primary-light dark:text-text-primary-dark">
                  Preço de Venda (€)
                </Label>
                <Input
                  id="sale-price"
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Selecione um carro ou insira manualmente"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="down-payment" className="text-text-primary-light dark:text-text-primary-dark">
                  Entrada (€)
                </Label>
                <Input
                  id="down-payment"
                  type="number"
                  step="0.01"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="number-installments" className="text-text-primary-light dark:text-text-primary-dark">
                  Número de Parcelas
                </Label>
                <Input
                  id="number-installments"
                  type="number"
                  min="1"
                  value={numberOfInstallments}
                  onChange={(e) => setNumberOfInstallments(e.target.value)}
                  placeholder="Ex: 12"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="installment-value" className="text-text-primary-light dark:text-text-primary-dark">
                  Valor da Parcela (€) - Calculado Automaticamente
                </Label>
                <Input
                  id="installment-value"
                  type="number"
                  step="0.01"
                  value={installmentValue}
                  readOnly
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none cursor-not-allowed opacity-75"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="payment-method" className="text-text-primary-light dark:text-text-primary-dark">
                  Método de Pagamento
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectContent>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                    <SelectItem value="transferencia_bancaria">Transferência Bancária</SelectItem>
                    <SelectItem value="debito_direto">Débito Direto</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="numerario">Numerário</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="first-payment-date" className="text-text-primary-light dark:text-text-primary-dark">
                  Primeira Data de Pagamento
                </Label>
                <Input
                  id="first-payment-date"
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations" className="text-text-primary-light dark:text-text-primary-dark">
                Observações
              </Label>
              <textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações adicionais sobre o contrato..."
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="debt-confession"
                checked={includeDebtConfession}
                onChange={(e) => setIncludeDebtConfession(e.target.checked)}
                className="rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500"
              />
              <Label htmlFor="debt-confession" className="cursor-pointer text-text-primary-light dark:text-text-primary-dark">
                Incluir Confissão de Dívida
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Vídeo do Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
              <Video className="h-5 w-5" />
              Vídeo do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractVideoUpload
              currentVideoUrl={videoUrl}
              onVideoChange={setVideoUrl}
            />
          </CardContent>
        </Card>

        {/* Botão de Gerar */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerateContract}
            disabled={!selectedCar || !selectedClient || !salePrice}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Gerar Contratos PDF
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}