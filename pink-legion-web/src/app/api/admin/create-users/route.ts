import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type NewUser = { email: string; password: string }

// Fallbacks (já existentes no projeto via generate-contract-pdf.ts)
const FALLBACK_URL = 'https://bzkgjtxrzwzoibzesphi.supabase.co'
const FALLBACK_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyMzQwOCwiZXhwIjoyMDc0Mjk5NDA4fQ.KZ3cqy2fN5UDnp8TG_mV6fRJgqo1Myb0Djud77plDL8'

function getEnv(name: string) {
  const val = process.env[name]
  if (val) return val
  // Fallbacks específicos
  if (name === 'NEXT_PUBLIC_SUPABASE_URL') return FALLBACK_URL
  if (name === 'SUPABASE_SERVICE_ROLE_KEY') return FALLBACK_SERVICE_KEY
  throw new Error(`Missing env: ${name}`)
}

function getServiceClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient()

    const body = await req.json()
    const { users, role } = body as { users: NewUser[]; role: 'admin' | 'comercial' | 'financeiro' }

    if (!Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: 'Lista de usuários inválida' }), { status: 400 })
    }

    // Validate role
    const targetRole = role || 'admin'
    if (!['admin', 'comercial', 'financeiro'].includes(targetRole)) {
      return new Response(JSON.stringify({ error: 'Role inválido' }), { status: 400 })
    }

    const results: any[] = []

    for (const u of users) {
      const email = (u?.email || '').trim().toLowerCase()
      const password = String(u?.password || '').trim()
      if (!email || !password) {
        results.push({ email, ok: false, error: 'Email ou senha ausentes' })
        continue
      }

      // 1) Verificar se já existe usuário
      const { data: existing, error: existingErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (existingErr) {
        results.push({ email, ok: false, error: `Erro ao consultar perfil: ${existingErr.message}` })
        continue
      }

      if (existing) {
        // Atualizar role para admin se necessário
        if (existing.role !== targetRole) {
          const { error: upErr } = await supabase
            .from('profiles')
            .update({ role: targetRole })
            .eq('id', existing.id)

          if (upErr) {
            results.push({ email, ok: false, error: `Erro ao atualizar role: ${upErr.message}` })
          } else {
            results.push({ email, ok: true, action: 'updated_role', role: targetRole })
          }
        } else {
          results.push({ email, ok: true, action: 'already_exists', role: existing.role })
        }
        continue
      }

      // 2) Criar usuário via Admin API (service role)
      const signupRes = await fetch(`${getEnv('NEXT_PUBLIC_SUPABASE_URL')}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getEnv('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: targetRole,
            full_name: email.split('@')[0]
          }
        })
      })

      if (!signupRes.ok) {
        const text = await signupRes.text()
        results.push({ email, ok: false, error: `Falha na criação: ${text}` })
        continue
      }

      const created = await signupRes.json()
      const newUserId = created?.id

      // 3) Garantir role correto no perfil (trigger geralmente cria)
      if (newUserId) {
        const { error: setRoleErr } = await supabase
          .from('profiles')
          .update({ role: targetRole })
          .eq('id', newUserId)

        if (setRoleErr) {
          results.push({ email, ok: false, error: `Criado, mas erro ao definir role: ${setRoleErr.message}` })
        } else {
          results.push({ email, ok: true, action: 'created', id: newUserId, role: targetRole })
        }
      } else {
        results.push({ email, ok: true, action: 'created_without_id' })
      }
    }

    return new Response(JSON.stringify({ results }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('Erro no endpoint admin create-users:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro inesperado' }), { status: 500 })
  }
}