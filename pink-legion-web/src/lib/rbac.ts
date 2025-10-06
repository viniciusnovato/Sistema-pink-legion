import { supabase } from './supabase'

export type UserRole = 'admin' | 'comercial' | 'financeiro'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Definir permissões por role
export const ROLE_PERMISSIONS = {
  admin: {
    // Admin tem acesso total
    canViewDashboard: true,
    canViewCars: true,
    canCreateCars: true,
    canEditCars: true,
    canDeleteCars: true,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: true,
    canViewSettings: true,
    canManageUsers: true,
    canViewReports: true,
    canAccessAdminAPI: true
  },
  comercial: {
    // Comercial pode gerenciar carros, clientes e contratos
    canViewDashboard: true,
    canViewCars: true,
    canCreateCars: true,
    canEditCars: true,
    canDeleteCars: false, // Não pode deletar carros
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: false, // Não pode deletar clientes
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: false, // Não pode deletar contratos
    canViewSettings: false,
    canManageUsers: false,
    canViewReports: true,
    canAccessAdminAPI: false
  },
  financeiro: {
    // Financeiro tem acesso limitado, focado em relatórios e clientes
    canViewDashboard: true,
    canViewCars: true,
    canCreateCars: false,
    canEditCars: false,
    canDeleteCars: false,
    canViewClients: true,
    canCreateClients: false,
    canEditClients: true, // Pode editar dados financeiros dos clientes
    canDeleteClients: false,
    canViewContracts: true,
    canCreateContracts: false,
    canEditContracts: true, // Pode editar aspectos financeiros dos contratos
    canDeleteContracts: false,
    canViewSettings: false,
    canManageUsers: false,
    canViewReports: true,
    canAccessAdminAPI: false
  }
} as const

// Função para obter o perfil do usuário atual
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profile as UserProfile
  } catch (error) {
    console.error('Error getting current user profile:', error)
    return null
  }
}

// Função para verificar se o usuário tem uma permissão específica
export function hasPermission(userRole: UserRole, permission: keyof typeof ROLE_PERMISSIONS.admin): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions[permission] || false
}

// Função para verificar se o usuário pode acessar uma rota
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Admin tem acesso a tudo
  if (userRole === 'admin') {
    return true
  }

  // Definir rotas por role
  const routeAccess = {
    comercial: [
      '/dashboard',
      '/cars',
      '/clients',
      '/dashboard/contracts'
    ],
    financeiro: [
      '/dashboard',
      '/clients',
      '/dashboard/contracts'
    ]
  }

  const allowedRoutes = routeAccess[userRole] || []
  return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute))
}

// Hook personalizado para usar RBAC em componentes React
export function useRBAC() {
  return {
    hasPermission,
    canAccessRoute,
    getCurrentUserProfile
  }
}

// Função para verificar se o usuário é admin
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin'
}

// Função para verificar se o usuário é comercial
export function isComercial(userRole: UserRole): boolean {
  return userRole === 'comercial'
}

// Função para verificar se o usuário é financeiro
export function isFinanceiro(userRole: UserRole): boolean {
  return userRole === 'financeiro'
}

// Função para obter as permissões de um role
export function getRolePermissions(userRole: UserRole) {
  return ROLE_PERMISSIONS[userRole]
}

// Função para verificar múltiplas permissões
export function hasAnyPermission(userRole: UserRole, permissions: Array<keyof typeof ROLE_PERMISSIONS.admin>): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Função para verificar todas as permissões
export function hasAllPermissions(userRole: UserRole, permissions: Array<keyof typeof ROLE_PERMISSIONS.admin>): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Middleware para verificar permissões em API routes
export function requirePermission(permission: keyof typeof ROLE_PERMISSIONS.admin) {
  return async (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error(`Acesso negado. Permissão necessária: ${permission}`)
    }
    return true
  }
}

// Função para filtrar dados baseado no role do usuário
export function filterDataByRole<T>(data: T[], userRole: UserRole, filterFn?: (item: T, role: UserRole) => boolean): T[] {
  if (userRole === 'admin') {
    return data // Admin vê tudo
  }

  if (filterFn) {
    return data.filter(item => filterFn(item, userRole))
  }

  return data // Por padrão, retorna todos os dados
}