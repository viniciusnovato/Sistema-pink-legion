'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, UserProfile } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar,
  Euro,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Car,
  FileText,
  Plus
} from 'lucide-react'

interface Contract {
  id: string
  client_id: string
  car_id: string
  contract_number: string
  contract_type: string
  total_amount: number
  down_payment?: number
  financed_amount: number
  installments?: number
  installment_amount?: number
  interest_rate?: number
  status: string
  contract_date: string
  first_payment_date?: string
  clients: {
    id: string
    full_name: string
    email: string
    phone?: string
  }
  cars: {
    id: string
    brand: string
    model: string
    year: number
    license_plate: string
  }
}

interface Payment {
  id: string
  contract_id: string
  installment_number: number
  amount: number
  due_date: string
  payment_date?: string
  status: string
  payment_method?: string
  notes?: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        setUser(user)
        const userProfile = await getCurrentUserProfile()
        setProfile(userProfile)
      } catch (error) {
        logger.error('Error fetching user profile in payments', error as Error)
        router.push('/login')
      }
    }

    getUser()
    fetchContracts()
    fetchPayments()
  }, [])

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

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (
            id,
            full_name,
            email,
            phone
          ),
          cars (
            id,
            brand,
            model,
            year,
            license_plate
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContracts(data || [])
    } catch (error) {
      console.error('Erro ao buscar contratos:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInstallments = async (contractId: string) => {
    try {
      const contract = contracts.find(c => c.id === contractId)
      if (!contract || !contract.installments || !contract.installment_amount || !contract.first_payment_date) {
        alert('Contrato não possui informações suficientes para gerar parcelas')
        return
      }

      // Verificar se já existem parcelas para este contrato
      const existingPayments = payments.filter(p => p.contract_id === contractId)
      if (existingPayments.length > 0) {
        const confirmRegenerate = confirm('Este contrato já possui parcelas. Deseja regenerá-las?')
        if (!confirmRegenerate) return

        // Deletar parcelas existentes
        const { error: deleteError } = await supabase
          .from('payments')
          .delete()
          .eq('contract_id', contractId)

        if (deleteError) throw deleteError
      }

      // Gerar novas parcelas
      const installmentsToInsert = []
      const firstPaymentDate = new Date(contract.first_payment_date)

      for (let i = 1; i <= contract.installments; i++) {
        const dueDate = new Date(firstPaymentDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))

        installmentsToInsert.push({
          contract_id: contractId,
          installment_number: i,
          amount: contract.installment_amount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente'
        })
      }

      const { error } = await supabase
        .from('payments')
        .insert(installmentsToInsert)

      if (error) throw error

      alert(`${contract.installments} parcelas geradas com sucesso!`)
      fetchPayments()
    } catch (error) {
      console.error('Erro ao gerar parcelas:', error)
      alert('Erro ao gerar parcelas')
    }
  }

  const markAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'pago',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', paymentId)

      if (error) throw error
      fetchPayments()
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      alert('Erro ao marcar pagamento como pago')
    }
  }

  // Determina o status atual da parcela considerando a data de vencimento
  const updatePaymentStatus = (payment: Payment) => {
    const today = new Date()
    const dueDate = new Date(payment.due_date)
    // normaliza para comparar apenas datas
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)

    if (payment.status === 'pago') return 'pago'
    if (dueDate < today) return 'atrasado'
    return 'pendente'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'atrasado':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'atrasado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.clients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${contract.cars.brand} ${contract.cars.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const baseMatch = statusFilter === 'all' ? matchesSearch : (matchesSearch && contract.status === statusFilter)
    if (!overdueOnly) return baseMatch
    const contractPayments = payments.filter(p => p.contract_id === contract.id)
    const hasOverdue = contractPayments.some(p => updatePaymentStatus(p) === 'atrasado')
    return baseMatch && hasOverdue
  })

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      logger.error('Error during logout', error as Error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        userRole={profile?.role}
        userName={profile?.full_name || user?.email}
        userEmail={user?.email}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando pagamentos...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole={profile?.role}
      userName={profile?.full_name || user?.email}
      userEmail={user?.email}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
            <p className="text-gray-600">Gerencie parcelas e pagamentos dos contratos</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por contrato, cliente ou veículo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
                Mostrar apenas contratos com parcelas atrasadas
              </label>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="grid gap-6">
          {filteredContracts.map((contract) => {
            const contractPayments = payments.filter(p => p.contract_id === contract.id)
            const paidPayments = contractPayments.filter(p => updatePaymentStatus(p) === 'pago')
            const pendingPayments = contractPayments.filter(p => updatePaymentStatus(p) === 'pendente')
            const overduePayments = contractPayments.filter(p => updatePaymentStatus(p) === 'atrasado')

            return (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contrato {contract.contract_number}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {contract.clients.full_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          {contract.cars.brand} {contract.cars.model} ({contract.cars.year})
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          €{contract.total_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {contractPayments.length === 0 && contract.installments && (
                        <Button
                          onClick={() => generateInstallments(contract.id)}
                          size="sm"
                          className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Gerar Parcelas
                        </Button>
                      )}
                      {contractPayments.length > 0 && (
                        <Button
                          onClick={() => generateInstallments(contract.id)}
                          size="sm"
                          className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Regenerar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {contractPayments.length > 0 ? (
                    <div className="space-y-4">
                      {/* Payment Summary */}
                      <div 
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                        style={{
                          backgroundColor: isDarkMode ? '#1f2937' : 'white'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{paidPayments.length}</div>
                          <div className="text-sm dark:text-gray-300" style={{ color: !isDarkMode ? '#111827' : undefined }}>Pagas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingPayments.length}</div>
                          <div className="text-sm dark:text-gray-300" style={{ color: !isDarkMode ? '#111827' : undefined }}>Pendentes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overduePayments.length}</div>
                          <div className="text-sm dark:text-gray-300" style={{ color: !isDarkMode ? '#111827' : undefined }}>Atrasadas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{contractPayments.length}</div>
                          <div className="text-sm dark:text-gray-300" style={{ color: !isDarkMode ? '#111827' : undefined }}>Total</div>
                        </div>
                      </div>

                      {/* Payment List */}
                      <div className="space-y-2">
                        {contractPayments.slice(0, 5).map((payment) => {
                          const currentStatus = updatePaymentStatus(payment)
                          return (
                          <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(currentStatus)}
                              <div>
                                <div className="font-medium">
                                  Parcela {payment.installment_number}
                                </div>
                              <div className="text-sm text-gray-600">
                                Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-PT')}
                                {payment.payment_date && (
                                  <span className="ml-2">
                                    | Pago em: {new Date(payment.payment_date).toLocaleDateString('pt-PT')}
                                  </span>
                                )}
                              </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-medium">€{payment.amount.toLocaleString()}</div>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(currentStatus)}`}>
                                  {currentStatus}
                                </span>
                              </div>
                              {(currentStatus === 'pendente' || currentStatus === 'atrasado') && (
                                <Button
                                  onClick={() => markAsPaid(payment.id)}
                                  size="sm"
                                  className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Marcar como Pago
                                </Button>
                              )}
                            </div>
                          </div>
                          )
                        })}
                        {contractPayments.length > 5 && (
                          <div className="text-center py-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/dashboard/payments/${contract.id}`)}
                              className="bg-pink-600 hover:bg-pink-700 text-white"
                            >
                              Ver todas as {contractPayments.length} parcelas
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma parcela gerada para este contrato</p>
                      {contract.installments && (
                        <p className="text-sm mt-2">
                          Clique em "Gerar Parcelas" para criar {contract.installments} parcelas
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredContracts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Não há contratos cadastrados ainda'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}