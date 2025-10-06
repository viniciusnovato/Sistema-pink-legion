'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save, User, CreditCard, MapPin } from 'lucide-react'
import { logger } from '@/lib/logger'
import { getBankByIban, getBicByIban, isValidPortugueseIban, formatIban } from '@/lib/portuguese-banks'

interface NewClient {
  full_name: string
  email: string
  phone: string
  nif: string
  cc?: string
  passport?: string
  has_cc: boolean
  birth_date: string
  gender: 'masculino' | 'feminino' | 'outro' | ''
  nationality: string
  status: 'active' | 'inactive' | 'pending' | 'blocked'
  address: {
    street: string
    number: string
    city: string
    postal_code: string
  }
  iban?: string
  // Campos do cartão de crédito
  card_number?: string
  card_holder_name?: string
  card_expiry_date?: string
  card_cvv?: string
  // Campo de notas
  notes?: string
}

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ibanInput, setIbanInput] = useState('')
  const [detectedBic, setDetectedBic] = useState('')
  const [detectedBank, setDetectedBank] = useState('')
  
  const [client, setClient] = useState<NewClient>({
    full_name: '',
    email: '',
    phone: '',
    nif: '',
    has_cc: true,
    birth_date: '',
    gender: '',
    nationality: '',
    status: 'active',
    address: {
      street: '',
      number: '',
      city: '',
      postal_code: ''
    },
    // Campos do cartão de crédito
    card_number: '',
    card_holder_name: '',
    card_expiry_date: '',
    card_cvv: '',
    // Campo de notas
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setClient(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setClient(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleToggleCC = (hasCC: boolean) => {
    setClient(prev => ({
      ...prev,
      has_cc: hasCC,
      cc: hasCC ? prev.cc : '',
      passport: hasCC ? '' : prev.passport
    }))
  }

  const handleIbanChange = (value: string) => {
    setIbanInput(value)
    
    if (value.length >= 21) {
      const bank = getBankByIban(value)
      const bic = getBicByIban(value)
      
      if (bank && bic) {
        setDetectedBank(bank.name)
        setDetectedBic(bic)
        console.log('Bank detected:', bank.name, 'BIC:', bic)
      } else {
        setDetectedBank('')
        setDetectedBic('')
      }
    } else {
      setDetectedBank('')
      setDetectedBic('')
    }
  }

  const validateForm = () => {
    if (!client.full_name.trim()) {
      logger.error('Nome completo é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    if (!client.email.trim()) {
      logger.error('Email é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    if (!client.nif.trim()) {
      logger.error('NIF é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    if (client.has_cc && !client.cc?.trim()) {
      logger.error('Cartão de Cidadão é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    if (!client.has_cc && !client.passport?.trim()) {
      logger.error('Passaporte é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Map form data to database schema
      const clientData = {
        full_name: client.full_name,
        email: client.email || null,
        phone: client.phone,
        nif: client.nif || null,
        cc: client.has_cc ? client.cc : null,
        passport: !client.has_cc ? client.passport : null,
        has_cc: client.has_cc,
        birth_date: client.birth_date || null,
        gender: client.gender || null,
        nationality: client.nationality || null,
        status: client.status,
        // Address components (separate fields in database)
        street: client.address.street || null,
        number: client.address.number || null,
        city: client.address.city || null,
        postal_code: client.address.postal_code || null,
        // Keep original address field for backward compatibility
        address: client.address.street && client.address.number 
          ? `${client.address.street}, ${client.address.number}` 
          : null,
        // Banking information
        iban: ibanInput || null,
        bank_name: detectedBank || null,
        account_holder: client.full_name, // Use full name as account holder by default
        // Card information
        card_number: client.card_number || null,
        card_holder_name: client.card_holder_name || null,
        card_expiry: client.card_expiry_date || null,
        card_cvv: client.card_cvv || null,
        // Notes field
        notes: client.notes || null,
        // Additional fields that exist in database but not in form (set to null for now)
        whatsapp: null,
        state: null,
        profession: null,
        monthly_income: null,
        company: null
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (error) throw error

      logger.info('Cliente adicionado com sucesso!', 'CLIENT_CREATE', { clientId: data.id })
      router.push(`/clients/${data.id}`)
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error)
      logger.error('Erro ao adicionar cliente', error as Error, 'CLIENT_CREATE')
    } finally {
      setLoading(false)
    }
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
                Novo Cliente
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Informações essenciais do cliente
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome Completo *"
                value={client.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Digite o nome completo"
              />
              <Input
                label="Email *"
                type="email"
                value={client.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite o email"
              />
              <Input
                label="NIF *"
                value={client.nif}
                onChange={(e) => handleInputChange('nif', e.target.value)}
                placeholder="000000000"
              />
              
              {/* Toggle para Cartão de Cidadão ou Passaporte */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                  Documento de Identificação *
                </label>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="document_type"
                      checked={client.has_cc}
                      onChange={() => handleToggleCC(true)}
                      className="mr-2 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      Cartão de Cidadão
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="document_type"
                      checked={!client.has_cc}
                      onChange={() => handleToggleCC(false)}
                      className="mr-2 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      Passaporte
                    </span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {client.has_cc ? (
                    <Input
                      label="Cartão de Cidadão *"
                      value={client.cc || ''}
                      onChange={(e) => handleInputChange('cc', e.target.value)}
                      placeholder="00000000 0 ZZ0"
                    />
                  ) : (
                    <Input
                      label="Passaporte *"
                      value={client.passport || ''}
                      onChange={(e) => handleInputChange('passport', e.target.value)}
                      placeholder="C0000000"
                    />
                  )}
                  <Input
                    label="Telefone"
                    value={client.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+351 000 000 000"
                  />
                </div>
              </div>
              <Input
                label="Data de Nascimento"
                type="date"
                value={client.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Género
                  </label>
                  <select
                    value={client.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Selecionar género</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                
                <Input
                  label="Nacionalidade"
                  value={client.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Portuguesa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Estado
                </label>
                <select
                  value={client.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Bancárias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Informações Bancárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  label="IBAN (Opcional)"
                  value={ibanInput}
                  onChange={(e) => handleIbanChange(e.target.value)}
                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  O BIC/SWIFT será detectado automaticamente para bancos portugueses
                </p>
              </div>
              
              {/* Display detected bank and BIC */}
              {detectedBic && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Banco detectado:</strong> {detectedBank}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>BIC/SWIFT:</strong> {detectedBic}
                  </p>
                </div>
              )}
              
              {/* Warning for unrecognized IBAN */}
              {ibanInput.length >= 21 && !detectedBic && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    IBAN não reconhecido ou não é de um banco português
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Cartão de Crédito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Dados do Cartão de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Número do Cartão"
                value={client.card_number || ''}
                onChange={(e) => {
                  // Formatar número do cartão com espaços a cada 4 dígitos
                  const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
                  if (value.replace(/\s/g, '').length <= 16) {
                    handleInputChange('card_number', value)
                  }
                }}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
              <Input
                label="Nome no Cartão"
                value={client.card_holder_name || ''}
                onChange={(e) => handleInputChange('card_holder_name', e.target.value.toUpperCase())}
                placeholder="NOME COMPLETO"
              />
              <Input
                label="Data de Validade"
                value={client.card_expiry_date || ''}
                onChange={(e) => {
                  // Formatar data MM/YY
                  const value = e.target.value.replace(/\D/g, '')
                  let formatted = value
                  if (value.length >= 2) {
                    formatted = value.substring(0, 2) + '/' + value.substring(2, 4)
                  }
                  if (formatted.length <= 5) {
                    handleInputChange('card_expiry_date', formatted)
                  }
                }}
                placeholder="MM/YY"
                maxLength={5}
              />
              <Input
                label="CVV"
                value={client.card_cvv || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 4) {
                    handleInputChange('card_cvv', value)
                  }
                }}
                placeholder="000"
                maxLength={4}
                type="password"
              />
            </div>
          </CardContent>
        </Card>

        {/* Morada Simplificada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Morada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Rua e Número"
                value={`${client.address.street} ${client.address.number}`.trim()}
                onChange={(e) => {
                  const parts = e.target.value.split(' ')
                  const number = parts[parts.length - 1]
                  const street = parts.slice(0, -1).join(' ')
                  handleInputChange('address.street', street)
                  handleInputChange('address.number', number)
                }}
                placeholder="Rua das Flores, 123"
              />
              <Input
                label="Cidade"
                value={client.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                placeholder="Lisboa"
              />
              <Input
                label="Código Postal"
                value={client.address.postal_code}
                onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                placeholder="1000-000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notas Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Notas Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={client.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas adicionais sobre o cliente..."
              rows={4}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}