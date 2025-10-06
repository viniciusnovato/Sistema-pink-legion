import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/cars',
  '/clients',
  '/settings',
  '/api/admin'
]

// Rotas que requerem role específico
const roleBasedRoutes = {
  admin: [
    '/settings',
    '/api/admin/create-users'
  ],
  comercial: [
    '/cars',
    '/clients',
    '/dashboard'
  ],
  financeiro: [
    '/dashboard',
    '/clients'
  ]
}

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/debug-error'
]

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzkgjtxrzwzoibzesphi.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.Ej7Uy8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8Ey8'
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

async function getUserProfile(userId: string) {
  try {
    const supabase = getSupabaseClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error)
    return null
  }
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route))
}

function hasRoleAccess(userRole: string, pathname: string): boolean {
  // Admin tem acesso a tudo
  if (userRole === 'admin') {
    return true
  }

  // Verificar se a rota requer role específico
  const allowedRoutes = roleBasedRoutes[userRole as keyof typeof roleBasedRoutes] || []
  
  return allowedRoutes.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rotas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Verificar se é uma rota protegida
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  try {
    // Obter token de autenticação do cookie
    const token = request.cookies.get('sb-bzkgjtxrzwzoibzesphi-auth-token')?.value

    if (!token) {
      console.log('No auth token found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Decodificar o token para obter o user ID
    let userId: string | null = null
    try {
      const tokenData = JSON.parse(token)
      userId = tokenData?.user?.id
    } catch (e) {
      console.error('Error parsing auth token:', e)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!userId) {
      console.log('No user ID in token, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Buscar perfil do usuário no banco de dados
    const profile = await getUserProfile(userId)

    if (!profile) {
      console.log('User profile not found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar se o usuário tem acesso à rota baseado no role
    if (!hasRoleAccess(profile.role, pathname)) {
      console.log(`User ${profile.email} with role ${profile.role} denied access to ${pathname}`)
      
      // Redirecionar para dashboard se não tem acesso
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Adicionar informações do usuário aos headers para uso nas páginas
    const response = NextResponse.next()
    response.headers.set('x-user-id', profile.id)
    response.headers.set('x-user-email', profile.email)
    response.headers.set('x-user-role', profile.role)
    response.headers.set('x-user-name', profile.full_name || '')

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}