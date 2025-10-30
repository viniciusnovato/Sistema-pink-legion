'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft,
  CreditCard, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  Car,
  FileText,
  Euro,
  Calendar,
  Edit,
  Trash2,
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

export default function ContractPaymentsPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  const [contract, setContract] = useState<Contract | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    due_date: '',
    notes: ''
  })
  // Filters must be declared before any conditional returns to respect React Rules of Hooks
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente' | 'atrasado'>('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (contractId) {
      fetchContract()
      fetchPayments()
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

  const fetchContract = async () => {
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
        .eq('id', contractId)
        .single()

      if (error) throw error
      setContract(data)
    } catch (error) {
      console.error('Erro ao buscar contrato:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractId)
        .order('installment_number', { ascending: true })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error)
    } finally {
      setLoading(false)
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

  const markAsPending = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'pendente',
          payment_date: null,
        })
        .eq('id', paymentId)

      if (error) throw error
      fetchPayments()
    } catch (error) {
      console.error('Erro ao marcar como pendente:', error)
      alert('Erro ao marcar pagamento como pendente')
    }
  }

  const startEditing = (payment: Payment) => {
    setEditingPayment(payment.id)
    setEditForm({
      amount: payment.amount.toString(),
      due_date: payment.due_date,
      notes: payment.notes || ''
    })
  }

  const cancelEditing = () => {
    setEditingPayment(null)
    setEditForm({ amount: '', due_date: '', notes: '' })
  }

  const savePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          amount: parseFloat(editForm.amount),
          due_date: editForm.due_date,
          notes: editForm.notes || null
        })
        .eq('id', paymentId)

      if (error) throw error
      
      setEditingPayment(null)
      setEditForm({ amount: '', due_date: '', notes: '' })
      fetchPayments()
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error)
      alert('Erro ao salvar alterações')
    }
  }

  const deletePayment = async (paymentId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta parcela?')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error
      fetchPayments()
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error)
      alert('Erro ao excluir parcela')
    }
  }

  const regenerateInstallments = async () => {
    if (!contract || !contract.installments || !contract.installment_amount || !contract.first_payment_date) {
      alert('Contrato não possui informações suficientes para gerar parcelas')
      return
    }

    const confirmRegenerate = confirm('Isso irá excluir todas as parcelas existentes e gerar novas. Deseja continuar?')
    if (!confirmRegenerate) return

    try {
      // Deletar parcelas existentes
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('contract_id', contractId)

      if (deleteError) throw deleteError

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

      alert(`${contract.installments} parcelas regeneradas com sucesso!`)
      fetchPayments()
    } catch (error) {
      console.error('Erro ao regenerar parcelas:', error)
      alert('Erro ao regenerar parcelas')
    }
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

  const updatePaymentStatus = (payment: Payment) => {
    const today = new Date()
    const dueDate = new Date(payment.due_date)
    
    if (payment.status === 'pago') return 'pago'
    if (dueDate < today) return 'atrasado'
    return 'pendente'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando pagamentos...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Contrato não encontrado</div>
        </div>
      </DashboardLayout>
    )
  }
  const filteredPayments = payments.filter(p => {
    const currentStatus = updatePaymentStatus(p)
    const statusMatch = statusFilter === 'all' ? true : currentStatus === statusFilter
    if (!overdueOnly) return statusMatch
    const dueDate = new Date(p.due_date)
    const today = new Date()
    const isOverdue = currentStatus !== 'pago' && dueDate < today
    return statusMatch && isOverdue
  })
  const paidPayments = filteredPayments.filter(p => updatePaymentStatus(p) === 'pago')
  const pendingPayments = filteredPayments.filter(p => updatePaymentStatus(p) === 'pendente')
  const overduePayments = filteredPayments.filter(p => updatePaymentStatus(p) === 'atrasado')
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = filteredPayments.filter(p => updatePaymentStatus(p) !== 'pago').reduce((sum, p) => sum + p.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pagamentos - Contrato {contract.contract_number}
            </h1>
            <p className="text-gray-600">
              {contract.clients.full_name} | {contract.cars.brand} {contract.cars.model} ({contract.cars.year})
            </p>
          </div>
        </div>

        {/* Contract Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600">Valor Total</div>
                <div className="text-2xl font-bold text-blue-600">€{contract.total_amount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Valor Financiado</div>
                <div className="text-2xl font-bold text-purple-600">€{contract.financed_amount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Parcelas</div>
                <div className="text-2xl font-bold text-orange-600">{contract.installments || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Valor da Parcela</div>
                <div className="text-2xl font-bold text-green-600">€{(contract.installment_amount || 0).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Resumo dos Pagamentos
              </CardTitle>
              <Button
                onClick={regenerateInstallments}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Regenerar Parcelas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{paidPayments.length}</div>
                <div className="text-sm text-gray-800 dark:text-gray-300">Pagas</div>
                <div className="text-lg font-medium text-green-600 dark:text-green-400">€{totalPaid.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingPayments.length}</div>
                <div className="text-sm text-gray-800 dark:text-gray-300">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{overduePayments.length}</div>
                <div className="text-sm text-gray-800 dark:text-gray-300">Atrasadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{payments.length}</div>
                <div className="text-sm text-gray-800 dark:text-gray-300">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-red-600 dark:text-red-400">€{totalPending.toLocaleString()}</div>
                <div className="text-sm text-gray-800 dark:text-gray-300">A Receber</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Parcelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
                Mostrar somente parcelas atrasadas
              </label>
            </div>
            {payments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((payment) => {
                  const currentStatus = updatePaymentStatus(payment)
                  const isEditing = editingPayment === payment.id

                  return (
                    <div key={payment.id} className="border rounded-lg p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valor
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data de Vencimento
                              </label>
                              <Input
                                type="date"
                                value={editForm.due_date}
                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações
                              </label>
                              <Input
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="Observações..."
                              />
                            </div>
                          </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => savePayment(payment.id)}
                                size="sm"
                                className="bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                Salvar
                              </Button>
                              <Button
                                onClick={cancelEditing}
                                size="sm"
                                className="bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                Cancelar
                              </Button>
                            </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
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
                              {payment.notes && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Obs: {payment.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium text-lg">€{payment.amount.toLocaleString()}</div>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(currentStatus)}`}>
                                {currentStatus}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => startEditing(payment)}
                                size="sm"
                                className="p-2 bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {payment.status === 'pendente' ? (
                                <Button
                                  onClick={() => markAsPaid(payment.id)}
                                  size="sm"
                                  className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Pagar
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => markAsPending(payment.id)}
                                  size="sm"
                                  className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                  <Clock className="h-4 w-4" />
                                  Pendente
                                </Button>
                              )}
                              <Button
                                onClick={() => deletePayment(payment.id)}
                                size="sm"
                                className="p-2 bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma parcela encontrada</h3>
                <p className="text-gray-600 mb-4">
                  Este contrato ainda não possui parcelas geradas
                </p>
                <Button
                  onClick={regenerateInstallments}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Gerar Parcelas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}