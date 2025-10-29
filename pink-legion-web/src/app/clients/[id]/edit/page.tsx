'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save, User as UserIcon, CreditCard, MapPin } from 'lucide-react'
import { logger } from '@/lib/logger'
import { getBankByIban, getBicByIban, isValidPortugueseIban, formatIban } from '@/lib/portuguese-banks'
import { getCurrentUserProfile, type UserProfile } from '@/lib/rbac'
import type { User } from '@supabase/supabase-js'

interface Client {
  id: string
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
  profession: string
  monthly_income: number
  marital_status: 'single' | 'married' | 'divorced' | 'widowed'
  status: 'active' | 'inactive' | 'pending' | 'blocked'
  address: {
    street: string
    number: string
    complement: string
    parish: string
    city: string
    district: string
    postal_code: string
  }
  iban?: string
  bank_name?: string
  account_holder?: string
  card_number?: string
  card_holder_name?: string
  card_expiry?: string
  card_cvv?: string
  notes?: string
  created_at: string
  updated_at: string
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [ibanInput, setIbanInput] = useState('')
  const [detectedBic, setDetectedBic] = useState('')
  const [detectedBank, setDetectedBank] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      try {
        logger.info('Client edit page loaded', 'UI');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          logger.auth('No user found, redirecting to login');
          router.push('/login');
          return;
        }
        logger.auth('User authenticated in client edit page', { userId: user.id, email: user.email });
        setUser(user);
        const userProfile = await getCurrentUserProfile();
        if (!userProfile) {
          logger.error('Error fetching user profile or user has no profile', undefined, 'RBAC');
          logger.auth('User profile is null, sidebar will show limited options', { userId: user.id });
        } else {
          logger.supabase('User profile fetched successfully', { profileId: userProfile.id, role: userProfile.role });
          logger.auth('User role for sidebar filtering', { role: userProfile.role, hasRole: !!userProfile.role });
        }
        setProfile(userProfile);
        if (clientId) {
          await fetchClient();
        }
        setLoading(false);
      } catch (error) {
        logger.error('Unexpected error in client edit page initialization', error as Error, 'CLIENTS');
        setLoading(false);
      }
    };
    initializePage();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.auth(`Auth state change in client edit: ${event}`, { hasSession: !!session });
        if (event === 'SIGNED_OUT' || !session) {
          logger.auth('User signed out, redirecting to login');
          router.push('/login');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [clientId, router])

  const handleLogout = async () => {
    try {
      logger.auth('User logging out from client edit page');
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      logger.error('Error during logout', error as Error, 'AUTH');
    }
  }

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      
      // Process address field - it might be a JSON string or object
      let processedAddress = {
        street: '',
        number: '',
        complement: '',
        parish: '',
        city: '',
        district: '',
        postal_code: ''
      }

      if (data.address) {
        if (typeof data.address === 'string') {
          try {
            // Try to parse as JSON string
            const parsedAddress = JSON.parse(data.address)
            processedAddress = {
              street: parsedAddress.street || '',
              number: parsedAddress.number || '',
              complement: parsedAddress.complement || '',
              parish: parsedAddress.parish || '',
              city: parsedAddress.city || '',
              district: parsedAddress.district || '',
              postal_code: parsedAddress.postal_code || ''
            }
          } catch (e) {
            // If parsing fails, treat as plain string for street
            processedAddress.street = data.address
          }
        } else if (typeof data.address === 'object') {
          // Already an object
          processedAddress = {
            street: data.address.street || '',
            number: data.address.number || '',
            complement: data.address.complement || '',
            parish: data.address.parish || '',
            city: data.address.city || '',
            district: data.address.district || '',
            postal_code: data.address.postal_code || ''
          }
        }
      }

      // Set client data with processed address
      const clientData = {
        ...data,
        // Ensure all fields have default values to prevent undefined
        phone: data.phone || '',
        birth_date: data.birth_date || '',
        gender: data.gender || '',
        nationality: data.nationality || '',
        profession: data.profession || '',
        monthly_income: data.monthly_income || 0,
        marital_status: data.marital_status || 'single',
        iban: data.iban || '',
        bank_name: data.bank_name || '',
        account_holder: data.account_holder || '',
        card_number: data.card_number || '',
        card_holder_name: data.card_holder_name || '',
        card_expiry: data.card_expiry || '',
        card_cvv: data.card_cvv || '',
        notes: data.notes || '',
        address: processedAddress
      }
      
      setClient(clientData)
      
      // Set IBAN input if exists
      if (data.iban) {
        setIbanInput(data.iban)
        handleIbanChange(data.iban)
      }
      
      console.log('Cliente carregado:', clientData)
    } catch (error) {
      logger.error('Erro ao carregar cliente', error as Error, 'CLIENT_FETCH')
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    if (!client) return

    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setClient(prev => prev ? {
        ...prev,
        address: {
          ...(prev.address || {}),
          [addressField]: value
        }
      } : null)
    } else {
      setClient(prev => prev ? {
        ...prev,
        [field]: value
      } : null)
    }
  }

  const handleToggleCC = (hasCC: boolean) => {
    if (!client) return
    setClient(prev => prev ? {
      ...prev,
      has_cc: hasCC,
      cc: hasCC ? prev.cc : '',
      passport: hasCC ? '' : prev.passport
    } : null)
  }

  const handleIbanChange = (value: string) => {
    setIbanInput(value)
    
    // Try to detect bank even with incomplete IBAN (minimum 8 characters: PT50XXXX)
    if (value.length >= 8) {
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
    if (!client?.full_name.trim()) {
      logger.error('Nome completo é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    if (!client?.email.trim()) {
      logger.error('Email é obrigatório', undefined, 'CLIENT_VALIDATION')
      return false
    }
    if (!client?.nif.trim()) {
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
    if (!client || !validateForm()) return

    setSaving(true)
    try {
      const clientData = {
        ...client,
        monthly_income: typeof client.monthly_income === 'string' ? parseFloat(client.monthly_income) || 0 : client.monthly_income,
        birth_date: client.birth_date || null, // Convert empty string to null for date fields
        iban: ibanInput || null,
        bank_name: detectedBank || null,
        account_holder: client.full_name,
        // Serialize address object properly
        address: client.address ? JSON.stringify(client.address) : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)

      if (error) throw error

      logger.info('Cliente atualizado com sucesso!', 'CLIENT_UPDATE', { clientId })
      router.push(`/clients/${clientId}`)
    } catch (error) {
      logger.error('Erro ao atualizar cliente', error as Error, 'CLIENT_UPDATE')
    } finally {
      setSaving(false)
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout
        onLogout={handleLogout}
        userRole={profile?.role}
        userName={profile?.full_name || user?.email || ''}
        userEmail={user?.email || ''}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Cliente não encontrado
          </h2>
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
                Editar Cliente
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {client.full_name}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-800 hover:bg-primary-900 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Alterações'}
          </Button>
        </div>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
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
                    value={client.gender || ''}
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
                  value={client.nationality || ''}
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

        {/* Informações Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Profissão"
                value={client.profession || ''}
                onChange={(e) => handleInputChange('profession', e.target.value)}
                placeholder="Digite a profissão"
              />
              <Input
                label="Rendimento Mensal (€)"
                type="number"
                value={client.monthly_income ? client.monthly_income.toString() : ''}
                onChange={(e) => handleInputChange('monthly_income', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Estado Civil
                </label>
                <select
                  value={client.marital_status || 'single'}
                  onChange={(e) => handleInputChange('marital_status', e.target.value)}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="single">Solteiro(a)</option>
                  <option value="married">Casado(a)</option>
                  <option value="divorced">Divorciado(a)</option>
                  <option value="widowed">Viúvo(a)</option>
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

            {/* Dados do Cartão Bancário */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-4">
                Dados do Cartão Bancário (Opcional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Número do Cartão"
                  value={client.card_number || ''}
                  onChange={(e) => handleInputChange('card_number', e.target.value)}
                  placeholder="**** **** **** ****"
                  maxLength={19}
                />
                <Input
                  label="Nome do Titular"
                  value={client.card_holder_name || ''}
                  onChange={(e) => handleInputChange('card_holder_name', e.target.value)}
                  placeholder="Nome como aparece no cartão"
                />
                <Input
                  label="Data de Validade"
                  value={client.card_expiry || ''}
                  onChange={(e) => handleInputChange('card_expiry', e.target.value)}
                  placeholder="MM/AA"
                  maxLength={5}
                />
                <Input
                  label="CVV"
                  value={client.card_cvv || ''}
                  onChange={(e) => handleInputChange('card_cvv', e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  type="number"
                />
              </div>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Estes dados são opcionais e serão utilizados apenas para identificação do cartão
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Morada */}
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
                label="Rua"
                value={client.address?.street || ''}
                onChange={(e) => {
                  handleInputChange('address.street', e.target.value)
                }}
                placeholder="Rua das Flores"
              />
              <Input
                label="Número"
                value={client.address?.number || ''}
                onChange={(e) => handleInputChange('address.number', e.target.value)}
                placeholder="123"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Complemento"
                value={client.address?.complement || ''}
                onChange={(e) => handleInputChange('address.complement', e.target.value)}
                placeholder="3º Dto, Apartamento A"
              />
              <Input
                label="Freguesia"
                value={client.address?.parish || ''}
                onChange={(e) => handleInputChange('address.parish', e.target.value)}
                placeholder="Santa Maria Maior"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Cidade"
                value={client.address?.city || ''}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                placeholder="Lisboa"
              />
              <Input
                label="Distrito"
                value={client.address?.district || ''}
                onChange={(e) => handleInputChange('address.district', e.target.value)}
                placeholder="Lisboa"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Código Postal"
                value={client.address?.postal_code || ''}
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
              <UserIcon className="h-5 w-5 mr-2" />
              Notas Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={client.notes || ''}
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
            {loading ? 'Guardando...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}