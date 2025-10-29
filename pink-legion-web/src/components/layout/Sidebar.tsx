'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut,
  X
} from 'lucide-react'
import { UserRole } from '@/lib/rbac'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole?: UserRole
  userName?: string
  userEmail?: string
  onLogout?: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Carros',
    href: '/cars',
    icon: Car,
    roles: ['admin', 'comercial'],
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: Users,
  },
  {
    name: 'Contratos',
    href: '/dashboard/contracts',
    icon: FileText,
  },
  {
    name: 'Pagamentos',
    href: '/dashboard/payments',
    icon: CreditCard,
    roles: ['admin', 'financeiro'],
  },
  {
    name: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['admin', 'financeiro'],
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

export function Sidebar({ isOpen, onClose, userRole, userName, userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname()

  // Filtrar navegação baseada no role do usuário
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true // Se não tem restrição de role, mostra para todos
    if (!userRole) {
      console.warn('Sidebar: userRole is undefined/null, hiding restricted items:', item.name);
      return false // Se não tem role definido, não mostra itens restritos
    }
    const hasAccess = item.roles.includes(userRole);
    if (!hasAccess) {
      console.log(`Sidebar: User role '${userRole}' does not have access to '${item.name}' (requires: ${item.roles.join(', ')})`);
    }
    return hasAccess;
  })

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col bg-background-light dark:bg-background-dark border-r border-border-light dark:border-border-dark shadow-xl">
          {/* Logo and close button */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-medium">
                <span className="text-white font-bold text-sm">PL</span>
              </div>
              <span className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                Pink Legion
              </span>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              // Lógica corrigida para detectar estado ativo
              const isActive = pathname === item.href || 
                              (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
                              (item.href === '/dashboard' && pathname === '/dashboard') ||
                              // Detectar páginas de edição e detalhes
                              (item.href === '/cars' && (pathname.startsWith('/dashboard/cars/') || pathname.startsWith('/cars/'))) ||
                              (item.href === '/clients' && (pathname.startsWith('/dashboard/clients/') || pathname.startsWith('/clients/'))) ||
                              (item.href === '/dashboard/contracts' && pathname.startsWith('/dashboard/contracts/')) ||
                              (item.href === '/dashboard/payments' && pathname.startsWith('/dashboard/payments/')) ||
                              (item.href === '/dashboard/reports' && pathname.startsWith('/dashboard/reports/')) ||
                              (item.href === '/settings' && pathname.startsWith('/settings/'))
              
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]
                    ${isActive
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg hover:shadow-xl'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-600 dark:hover:text-secondary-400'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110
                    ${isActive ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark group-hover:text-secondary-600 dark:group-hover:text-secondary-400'}
                  `} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section and logout */}
          <div className="border-t border-border-light dark:border-border-dark p-4 space-y-4">
            {/* User info */}
            <div className="flex items-center space-x-3 px-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-medium">
                <span className="text-sm font-bold text-white">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                  {userName || 'Usuário'}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate capitalize">
                  {userRole || 'Sem role'}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout()
                } else {
                  console.log('Logout clicked - no handler provided')
                }
              }}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-error-600 dark:text-error-400 rounded-xl hover:bg-error-50 dark:hover:bg-error-900/20 transition-all duration-200 hover:scale-[1.02] group"
            >
              <LogOut className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}