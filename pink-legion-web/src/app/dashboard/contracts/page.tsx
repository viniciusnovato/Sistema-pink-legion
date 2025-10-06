'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FileText, Plus, Search, Eye, Download, Calendar, User, Car } from 'lucide-react'

interface Contract {
  id: string
  created_at: string
  client_name: string
  client_email: string
  sale_price: number
  contract_type: 'sale' | 'debt_confession'
  contract_number?: string
  total_amount?: number
  cars: {
    brand: string
    model: string
    year: number
  }
  clients: {
    full_name: string
    email: string
  }
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          cars (
            brand,
            model,
            year
          ),
          clients (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contracts:', error)
      } else {
        setContracts(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter(contract =>
    (contract.clients?.full_name?.toLowerCase() || contract.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (contract.clients?.email?.toLowerCase() || contract.client_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    `${contract.cars?.brand || ''} ${contract.cars?.model || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  const getContractTypeText = (type: string) => {
    return type === 'sale' ? 'Compra e Venda' : 'Confissão de Dívida'
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Contratos
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Gerir seus contratos de compra e venda
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark h-4 w-4" />
              <Input
                placeholder="Pesquisar contratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
              />
            </div>
            <Button
              onClick={() => router.push('/dashboard/contracts/new')}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Gerar Contrato
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, email ou veículo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark mb-4" />
              <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-center mb-6">
                {searchTerm ? 'Não foram encontrados contratos com os critérios de pesquisa.' : 'Comece criando seu primeiro contrato.'}
              </p>
              {!searchTerm && (
                 <Button
                   onClick={() => router.push('/dashboard/contracts/new')}
                   className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                 >
                   <Plus className="h-4 w-4" />
                   Criar Primeiro Contrato
                 </Button>
               )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-text-primary-light dark:text-text-primary-dark">
                    <span className="text-lg font-semibold">Contrato #{contract.contract_number || contract.id.slice(-6)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contract.contract_type === 'debt_confession' 
                        ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-200' 
                        : 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-200'
                    }`}>
                      {contract.contract_type === 'debt_confession' ? 'Confissão' : 'Venda'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{contract.clients?.full_name || contract.client_name || 'Cliente não identificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                    <Car className="h-4 w-4" />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {contract.cars?.brand} {contract.cars?.model} ({contract.cars?.year})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {new Date(contract.created_at).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        €{(contract.total_amount || contract.sale_price || 0).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {/* Download contract logic */}}
                          className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}