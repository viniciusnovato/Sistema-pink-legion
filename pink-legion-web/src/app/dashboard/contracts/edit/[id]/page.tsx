'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Car, User, Calculator, Download, Trash2, Save } from 'lucide-react'
// Substituindo gerador jsPDF por chamada ao endpoint de geração de PDF
import { generateUniqueFileName } from '@/lib/fileUtils'

// Component definitions (same as new contract page)
const Label = ({ htmlFor, children, className }: { htmlFor?: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium mb-2 ${className || ''}`}>
    {children}
  </label>
)

const Select = ({ children, onValueChange, value, className }: { 
  children: React.ReactNode, 
  onValueChange: (value: string) => void,
  value?: string,
  className?: string 
}) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 ${className || ''}`}
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
  engine: string
  color: string
  mileage: number
}

interface Client {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  nif?: string
}

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
  created_at: string
  cars: Car
  clients: Client
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

export default function EditContractPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Form states
  const [salePrice, setSalePrice] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [numberOfInstallments, setNumberOfInstallments] = useState('')
  const [installmentValue, setInstallmentValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transferencia_bancaria')
  const [observations, setObservations] = useState('')
  const [includeDebtConfession, setIncludeDebtConfession] = useState(false)

  useEffect(() => {
    if (contractId) {
      fetchContractDetails()
    }
  }, [contractId])

  const fetchContractDetails = async () => {
    try {
      setLoading(true)

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
            vin,
            engine,
            color,
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
      
      // Populate form with existing data
      setSalePrice(contractData.total_amount?.toString() || '')
      setDownPayment(contractData.down_payment?.toString() || '')
      setNumberOfInstallments(contractData.installments?.toString() || '')
      setInstallmentValue(contractData.installment_amount?.toString() || '')

    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Erro ao carregar dados do contrato')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!contract) return

    try {
      setSaving(true)

      const updatedData = {
        total_amount: parseFloat(salePrice),
        down_payment: parseFloat(downPayment) || 0,
        financed_amount: parseFloat(salePrice) - (parseFloat(downPayment) || 0),
        installments: parseInt(numberOfInstallments) || 0,
        installment_amount: parseFloat(installmentValue) || 0,
      }

      // Verificar se houve mudanças nas parcelas
      const installmentsChanged = 
        updatedData.installments !== contract.installments ||
        updatedData.installment_amount !== contract.installment_amount

      const { error } = await supabase
        .from('contracts')
        .update(updatedData)
        .eq('id', contractId)

      if (error) throw error

      // Se as parcelas mudaram, regenerar automaticamente
      if (installmentsChanged && updatedData.installments > 0 && updatedData.installment_amount > 0) {
        await regenerateInstallments(updatedData)
      }

      alert('Alterações salvas com sucesso!')
      
      // Update local state
      setContract(prev => prev ? { ...prev, ...updatedData } : null)

    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const regenerateInstallments = async (contractData: any) => {
    try {
      // Verificar se o contrato tem data de primeiro pagamento
      const { data: contractDetails, error: fetchError } = await supabase
        .from('contracts')
        .select('first_payment_date')
        .eq('id', contractId)
        .single()

      if (fetchError) throw fetchError

      if (!contractDetails.first_payment_date) {
        console.warn('Contrato não possui data de primeiro pagamento definida')
        return
      }

      // Deletar parcelas existentes
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('contract_id', contractId)

      if (deleteError) throw deleteError

      // Gerar novas parcelas
      const installmentsToInsert = []
      const firstPaymentDate = new Date(contractDetails.first_payment_date)

      for (let i = 1; i <= contractData.installments; i++) {
        const dueDate = new Date(firstPaymentDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))

        installmentsToInsert.push({
          contract_id: contractId,
          installment_number: i,
          amount: contractData.installment_amount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente'
        })
      }

      const { error: insertError } = await supabase
        .from('payments')
        .insert(installmentsToInsert)

      if (insertError) throw insertError

      console.log(`${contractData.installments} parcelas regeneradas automaticamente`)

    } catch (error) {
      console.error('Erro ao regenerar parcelas:', error)
      // Não mostrar erro para o usuário, apenas logar
    }
  }

  const handleRegenerateContract = async () => {
    if (!contract) return

    try {
      setRegenerating(true)

      // First save the changes to the contract
      const updatedData = {
        total_amount: parseFloat(salePrice),
        down_payment: parseFloat(downPayment) || 0,
        financed_amount: parseFloat(salePrice) - (parseFloat(downPayment) || 0),
        installments: parseInt(numberOfInstallments) || 0,
        installment_amount: parseFloat(installmentValue) || 0,
      }

      const { error: updateError } = await supabase
        .from('contracts')
        .update(updatedData)
        .eq('id', contractId)

      if (updateError) throw updateError

      // First, get existing documents to delete from storage
      const { data: existingDocs, error: fetchDocsError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('contract_id', contractId)

      if (fetchDocsError) {
        console.error('Error fetching existing documents:', fetchDocsError)
      }

      // Delete files from storage
      if (existingDocs && existingDocs.length > 0) {
        const filePaths = existingDocs.map(doc => doc.file_path)
        const { error: deleteStorageError } = await supabase.storage
          .from('documents')
          .remove(filePaths)

        if (deleteStorageError) {
          console.warn('Error deleting files from storage:', deleteStorageError)
        }
      }

      // Delete old contract documents from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('contract_id', contractId)

      if (deleteError) {
        console.error('Error deleting old documents:', deleteError)
      }

      // Generate new PDFs
      await generateContractPDFs()

      alert('Contrato regenerado com sucesso!')
      router.push(`/dashboard/contracts/${contractId}`)

    } catch (error) {
      console.error('Error regenerating contract:', error)
      alert('Erro ao regenerar contrato')
    } finally {
      setRegenerating(false)
    }
  }

  const generateContractPDFs = async () => {
    if (!contract) return

    // 🔍 DEBUG - Log dos dados do contrato
    console.log('🔍 DEBUG - Regeneração - Dados do Cliente:', {
      id: contract.clients.id,
      full_name: contract.clients.full_name,
      address_raw: contract.clients.address
    })

    const libContractData: LibContractData = {
      client: {
        id: contract.clients.id,
        full_name: contract.clients.full_name.trim(),
        email: contract.clients.email.trim(),
        phone: contract.clients.phone?.trim() || '',
        address: (() => {
          // PRIMEIRO: Priorizar campos separados
          if (contract.clients.street) {
            const parts = [contract.clients.street]
            if (contract.clients.number) parts.push(contract.clients.number)
            // Tentar pegar complemento do JSON se existir
            if (contract.clients.address && typeof contract.clients.address === 'string') {
              try {
                const addr = JSON.parse(contract.clients.address)
                if (addr.complement) parts.push(addr.complement)
              } catch {}
            }
            return parts.join(', ').trim()
          }
          
          // SEGUNDO: Fallback para JSON completo
          if (contract.clients.address && typeof contract.clients.address === 'string') {
            try {
              const addr = JSON.parse(contract.clients.address)
              const parts = []
              if (addr.street) parts.push(addr.street)
              if (addr.number) parts.push(addr.number)
              if (addr.complement) parts.push(addr.complement)
              return parts.join(', ').trim()
            } catch {
              return contract.clients.address.trim()
            }
          }
          return ''
        })(),
        city: (() => {
          // Priorizar campo separado city
          if (contract.clients.city) {
            return contract.clients.city
          }
          
          // Fallback: tentar ler do campo address JSON
          if (contract.clients.address && typeof contract.clients.address === 'string') {
            try {
              const addr = JSON.parse(contract.clients.address)
              return addr.city || ''
            } catch {
              return ''
            }
          }
          return ''
        })(),
        postal_code: (() => {
          // Priorizar campo separado postal_code
          if (contract.clients.postal_code) {
            return contract.clients.postal_code
          }
          
          // Fallback: tentar ler do campo address JSON
          if (contract.clients.address && typeof contract.clients.address === 'string') {
            try {
              const addr = JSON.parse(contract.clients.address)
              return addr.postal_code || ''
            } catch {
              return ''
            }
          }
          return ''
        })(),
        country: 'Portugal',
        nationality: (contract.clients as any).nationality || 'Portugal',
        bank_name: (contract.clients as any).bank_name || '',
        iban: (contract.clients as any).iban || '',
        swift: (contract.clients as any).swift || (contract.clients as any).bic || '',
        id_number: '',
        nif: contract.clients.nif?.trim() || ''
      },
      car: {
        id: contract.cars.id,
        brand: contract.cars.brand,
        model: contract.cars.model,
        year: contract.cars.year,
        license_plate: contract.cars.license_plate,
        vin: contract.cars.vin || '',
        engine: contract.cars.engine || '',
        color: contract.cars.color || '',
        mileage: contract.cars.mileage || 0
      },
      contract: {
        total_price: parseFloat(salePrice),
        down_payment: parseFloat(downPayment) || 0,
        financed_amount: parseFloat(salePrice) - (parseFloat(downPayment) || 0),
        installments: parseInt(numberOfInstallments) || 0,
        installment_amount: parseFloat(installmentValue) || 0,
        contract_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        contract_number: contract.contract_number,
        notes: observations
      }
    }

    // 🔍 DEBUG - Log do LibContractData montado
    console.log('🔍 DEBUG - Regeneração - LibContractData montado:', libContractData.client)

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
    const saleArrayBuffer = await saleResp.arrayBuffer()
    const saleContractBlob = new Blob([saleArrayBuffer], { type: 'application/pdf' })
    
    // Generate unique filename based on client NIF
    const saleContractFileName = await generateUniqueFileName(
      contract.clients.nif || '',
      'contrato-venda'
    )
    
    // Upload sale contract to Supabase Storage
    const { data: saleUploadData, error: saleUploadError } = await supabase.storage
      .from('documents')
      .upload(`contracts/${saleContractFileName}`, saleContractBlob, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (saleUploadError) throw saleUploadError

    // Get current user for uploaded_by field
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Save sale contract document record
    const saleDocumentData = {
      contract_id: contractId,
      client_id: contract.client_id,
      car_id: contract.car_id,
      document_type: 'contrato',
      file_name: saleContractFileName,
      file_path: saleUploadData.path,
      uploaded_by: user.id
    }

    const { error: saleDocError } = await supabase
      .from('documents')
      .insert(saleDocumentData)

    if (saleDocError) throw saleDocError

    // Gerar confissão de dívida se necessário
    if (includeDebtConfession && parseFloat(downPayment) < parseFloat(salePrice)) {
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
        contract.clients.nif || '',
        'confissao-divida'
      )
      
      // Upload debt confession to Supabase Storage
      const { data: debtUploadData, error: debtUploadError } = await supabase.storage
        .from('documents')
        .upload(`contracts/${debtConfessionFileName}`, debtConfessionBlob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (debtUploadError) throw debtUploadError

      // Save debt confession document record
      const debtDocumentData = {
        contract_id: contractId,
        client_id: contract.client_id,
        car_id: contract.car_id,
        document_type: 'contrato',
        file_name: debtConfessionFileName,
        file_path: debtUploadData.path,
        uploaded_by: user.id
      }

      const { error: debtDocError } = await supabase
        .from('documents')
        .insert(debtDocumentData)

      if (debtDocError) throw debtDocError
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

  if (!contract) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Editar Contrato #{contract.contract_number}
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Altere as informações e regenere o contrato se necessário
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              onClick={handleRegenerateContract}
              disabled={regenerating}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Download className="h-4 w-4" />
              {regenerating ? 'Regenerando...' : 'Regenerar Contrato'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input value={contract.clients.full_name} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={contract.clients.email} disabled />
              </div>
              {contract.clients.phone && (
                <div>
                  <Label>Telefone</Label>
                  <Input value={contract.clients.phone} disabled />
                </div>
              )}
              {contract.clients.nif && (
                <div>
                  <Label>NIF</Label>
                  <Input value={contract.clients.nif} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Car Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Informações do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Marca e Modelo</Label>
                <Input value={`${contract.cars.brand} ${contract.cars.model}`} disabled />
              </div>
              <div>
                <Label>Ano</Label>
                <Input value={contract.cars.year.toString()} disabled />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input value={contract.cars.license_plate} disabled />
              </div>
              {contract.cars.vin && (
                <div>
                  <Label>VIN</Label>
                  <Input value={contract.cars.vin} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Details (Editable) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Detalhes do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salePrice">Preço de Venda (€) *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Ex: 15000"
                  />
                </div>
                <div>
                  <Label htmlFor="downPayment">Entrada (€)</Label>
                  <Input
                    id="downPayment"
                    type="number"
                    step="0.01"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="Ex: 5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numberOfInstallments">Número de Prestações</Label>
                  <Input
                    id="numberOfInstallments"
                    type="number"
                    value={numberOfInstallments}
                    onChange={(e) => setNumberOfInstallments(e.target.value)}
                    placeholder="Ex: 12"
                  />
                </div>
                <div>
                  <Label htmlFor="installmentValue">Valor da Prestação (€)</Label>
                  <Input
                    id="installmentValue"
                    type="number"
                    step="0.01"
                    value={installmentValue}
                    onChange={(e) => setInstallmentValue(e.target.value)}
                    placeholder="Ex: 833.33"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectContent>
                      <SelectValue placeholder="Selecione o método" />
                      <SelectItem value="transferencia_bancaria">Transferência Bancária</SelectItem>
                      <SelectItem value="debito_direto">Débito Direto</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="numerario">Numerário</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="includeDebtConfession"
                    checked={includeDebtConfession}
                    onChange={(e) => setIncludeDebtConfession(e.target.checked)}
                    className="rounded border-border-light dark:border-border-dark"
                  />
                  <Label htmlFor="includeDebtConfession" className="mb-0">
                    Incluir Confissão de Dívida
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações adicionais sobre o contrato..."
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}