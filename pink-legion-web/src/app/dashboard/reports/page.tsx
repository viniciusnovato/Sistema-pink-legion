'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, UserProfile } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Euro, Calendar, Users, Car, CreditCard, AlertTriangle } from 'lucide-react'

interface Client {
  id: string
  full_name: string
  email?: string
}

interface CarItem {
  id: string
  brand: string
  model: string
  year: number
  license_plate: string
}

interface Contract {
  id: string
  client_id: string
  car_id: string
  contract_number: string
  contract_type: string
  total_amount: number
  down_payment?: number
  financed_amount?: number
  installments?: number
  installment_amount?: number
  status: string
  contract_date: string
  clients: Client
  cars: CarItem
}

interface Payment {
  id: string
  contract_id: string
  installment_number: number
  amount: number
  due_date: string
  payment_date?: string
  status: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [cars, setCars] = useState<CarItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'concluido' | 'cancelado'>('all')

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
        logger.error('Error fetching user profile in reports', error as Error)
        router.push('/login')
      }
    }

    const fetchAll = async () => {
      try {
        const [contractsRes, paymentsRes, carsRes, clientsRes] = await Promise.all([
          supabase
            .from('contracts')
            .select(`*, clients ( id, full_name, email ), cars ( id, brand, model, year, license_plate )`)
            .order('created_at', { ascending: false }),
          supabase
            .from('payments')
            .select('*')
            .order('due_date', { ascending: true }),
          supabase
            .from('cars')
            .select('id, brand, model, year, license_plate')
            .order('brand', { ascending: true }),
          supabase
            .from('clients')
            .select('id, full_name, email')
            .order('full_name', { ascending: true })
        ])

        if (contractsRes.error) throw contractsRes.error
        if (paymentsRes.error) throw paymentsRes.error
        if (carsRes.error) throw carsRes.error
        if (clientsRes.error) throw clientsRes.error

        setContracts(contractsRes.data || [])
        setPayments(paymentsRes.data || [])
        setCars(carsRes.data || [])
        setClients(clientsRes.data || [])
      } catch (error) {
        console.error('Erro ao carregar dados do relatório:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getUser()
    fetchAll()
  }, [])

  const normalizeDate = (d: Date) => {
    const nd = new Date(d)
    nd.setHours(0, 0, 0, 0)
    return nd
  }

  const updatePaymentStatus = (payment: Payment) => {
    const today = normalizeDate(new Date())
    const due = normalizeDate(new Date(payment.due_date))
    if (payment.status === 'pago') return 'pago'
    if (due < today) return 'atrasado'
    return 'pendente'
  }

  const isWithinRange = (dateStr?: string) => {
    if (!dateStr) return true
    const d = normalizeDate(new Date(dateStr))
    const start = startDate ? normalizeDate(new Date(startDate)) : null
    const end = endDate ? normalizeDate(new Date(endDate)) : null
    if (start && d < start) return false
    if (end && d > end) return false
    return true
  }

  // Aplicar filtros
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const statusOk = statusFilter === 'all' ? true : c.status === statusFilter
      const dateOk = isWithinRange(c.contract_date)
      return statusOk && dateOk
    })
  }, [contracts, statusFilter, startDate, endDate])

  const contractIdsInScope = useMemo(() => new Set(filteredContracts.map(c => c.id)), [filteredContracts])

  const paymentsByScope = useMemo(() => {
    return payments.filter(p => contractIdsInScope.has(p.contract_id))
  }, [payments, contractIdsInScope])

  // KPIs financeiros
  const valorTotalVendido = useMemo(() => {
    // Total vendido deve considerar todos os contratos no escopo atual,
    // independentemente do status.
    return filteredContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0)
  }, [filteredContracts])

  const valorFinanciado = useMemo(() => {
    return filteredContracts.reduce((sum, c) => sum + (c.financed_amount || 0), 0)
  }, [filteredContracts])

  const entradasPagas = useMemo(() => {
    return filteredContracts.reduce((sum, c) => sum + (c.down_payment || 0), 0)
  }, [filteredContracts])

  const pagamentosRecebidos = useMemo(() => {
    return paymentsByScope
      .filter(p => updatePaymentStatus(p) === 'pago' && isWithinRange(p.payment_date))
      .reduce((sum, p) => sum + p.amount, 0)
  }, [paymentsByScope, startDate, endDate])

  const parcelasRecebidas = useMemo(() => paymentsByScope.filter(p => updatePaymentStatus(p) === 'pago'), [paymentsByScope])
  const parcelasPendentes = useMemo(() => paymentsByScope.filter(p => updatePaymentStatus(p) === 'pendente'), [paymentsByScope])
  const parcelasAtrasadas = useMemo(() => paymentsByScope.filter(p => updatePaymentStatus(p) === 'atrasado'), [paymentsByScope])

  const valorAReceber = useMemo(() => {
    return paymentsByScope
      .filter(p => updatePaymentStatus(p) !== 'pago')
      .reduce((sum, p) => sum + p.amount, 0)
  }, [paymentsByScope])

  // Estatísticas de carros
  const carIdsConcluidos = useMemo(() => new Set(contracts.filter(c => c.status === 'concluido').map(c => c.car_id)), [contracts])
  const carIdsAtivos = useMemo(() => new Set(contracts.filter(c => c.status === 'ativo').map(c => c.car_id)), [contracts])
  const vendidos = useMemo(() => cars.filter(car => carIdsConcluidos.has(car.id)).length, [cars, carIdsConcluidos])
  const emFinanciamento = useMemo(() => cars.filter(car => carIdsAtivos.has(car.id)).length, [cars, carIdsAtivos])
  const disponiveis = useMemo(() => cars.filter(car => !carIdsConcluidos.has(car.id) && !carIdsAtivos.has(car.id)).length, [cars, carIdsConcluidos, carIdsAtivos])

  // Estatísticas de clientes
  const clientesComContrato = useMemo(() => new Set(contracts.map(c => c.client_id)).size, [contracts])
  const clientesComVendaConcluida = useMemo(() => new Set(contracts.filter(c => c.status === 'concluido').map(c => c.client_id)).size, [contracts])

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
          <div className="text-lg">Carregando Relatórios...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">KPIs e resumos com dados reais</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Início</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Fim</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Status do Contrato</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <Button onClick={() => { /* filtros já aplicados via estado */ }} className="bg-pink-600 hover:bg-pink-700 text-white">Aplicar</Button>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5" />KPIs Financeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Valor Total Vendido</div>
                <div className="text-2xl font-bold text-green-600">€{valorTotalVendido.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Valor Financiado</div>
                <div className="text-2xl font-bold text-blue-600">€{valorFinanciado.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Entradas Pagas</div>
                <div className="text-2xl font-bold text-orange-600">€{entradasPagas.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Valor já recebido</div>
                <div className="text-2xl font-bold text-green-700">€{pagamentosRecebidos.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Valor a receber</div>
                <div className="text-2xl font-bold text-red-600">€{valorAReceber.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Parcelas (Rec/ Pend/ Atr)</div>
                <div className="text-lg font-semibold text-gray-800">{parcelasRecebidas.length} / {parcelasPendentes.length} / {parcelasAtrasadas.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Carros e Clientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />Carros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Disponíveis</div>
                  <div className="text-2xl font-bold text-blue-600">{disponiveis}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Em financiamento</div>
                  <div className="text-2xl font-bold text-orange-600">{emFinanciamento}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Vendidos</div>
                  <div className="text-2xl font-bold text-green-600">{vendidos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Cadastrados</div>
                  <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Com contratos</div>
                  <div className="text-2xl font-bold text-orange-600">{clientesComContrato}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Vendas concluídas</div>
                  <div className="text-2xl font-bold text-green-600">{clientesComVendaConcluida}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Parcelas Atrasadas (Top 10) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Parcelas Atrasadas (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {parcelasAtrasadas.length > 0 ? (
              <div className="space-y-2">
                {parcelasAtrasadas.slice(0, 10).map(p => {
                  const contract = contracts.find(c => c.id === p.contract_id)
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Contrato {contract?.contract_number || p.contract_id} • Parcela {p.installment_number}</div>
                        <div className="text-sm text-gray-600">Cliente: {contract?.clients?.full_name || '—'} • Venc: {new Date(p.due_date).toLocaleDateString('pt-PT')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">€{p.amount.toLocaleString()}</div>
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">atrasado</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-gray-600">Não há parcelas atrasadas no escopo atual.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}