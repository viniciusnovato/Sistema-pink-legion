'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { getCurrentUserProfile, type UserProfile } from '@/lib/rbac'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          logger.auth('Nenhum usuário autenticado, redirecionando para login')
          router.push('/login')
          return
        }
        setUser(user)

        const userProfile = await getCurrentUserProfile()
        setProfile(userProfile)
      } catch (err) {
        logger.authError('Erro ao inicializar Configurações', err as Error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      logger.error('Erro ao fazer logout', error as Error)
    }
  }

  const handleChangePassword = async () => {
    setMessage('')
    if (!newPassword || newPassword.length < 6) {
      setMessage('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem.')
      return
    }
    setPasswordChanging(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        logger.authError('Erro ao trocar senha', error)
        setMessage(`Erro ao trocar senha: ${error.message}`)
      } else {
        setMessage('Senha alterada com sucesso!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      logger.authError('Falha inesperada ao trocar senha', err)
      setMessage(`Erro inesperado: ${err.message}`)
    } finally {
      setPasswordChanging(false)
    }
  }



  // User info derived from profile
  const userRole = profile?.role || 'Usuário'
  const userName = profile?.full_name || user?.email || 'Usuário'
  const userEmail = user?.email || ''

  if (loading) {
    return (
      <DashboardLayout
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
      >
        <div className="p-8">
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Configurações</h1>

          {/* Informações do Usuário */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
            {user && profile ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Nome:</span> {profile.full_name}</p>
                <p><span className="font-medium">Email:</span> {profile.email}</p>
                <p><span className="font-medium">Telefone:</span> {profile.phone || '—'}</p>
                <p><span className="font-medium">Perfil:</span> {profile.role}</p>
                <p><span className="font-medium">ID:</span> {profile.id}</p>
              </div>
            ) : (
              <p className="text-gray-600">Não foi possível carregar seu perfil.</p>
            )}
          </section>

          {/* Trocar Senha */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Trocar Senha</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                />
              </div>
            </div>
            {message && (
              <p className="mt-3 text-sm text-gray-700">{message}</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={passwordChanging}
              className="mt-4 inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {passwordChanging ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </section>


        </div>
      </div>
    </DashboardLayout>
  )
}