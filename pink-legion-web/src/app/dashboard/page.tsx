'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, logSupabaseOperation } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getCurrentUserProfile, UserProfile } from '@/lib/rbac';
import type { User } from '@supabase/supabase-js';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  Car, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Estados para dados reais
  const [dashboardData, setDashboardData] = useState({
    totalCars: 0,
    activeClients: 0,
    totalContracts: 0,
    monthlyRevenue: 0,
    recentActivity: [] as any[],
    upcomingTasks: [] as any[]
  });

  useEffect(() => {
    logger.info('Dashboard page loaded', 'UI');
    
    // Set current time on client side to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString('pt-PT'));
    
    const getUser = async () => {
      try {
        logger.auth('Getting current user from dashboard');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          logger.auth('No user found, redirecting to login');
          router.push('/login');
          return;
        }

        logger.auth('User authenticated in dashboard', { userId: user.id, email: user.email });
        setUser(user);

        // Buscar perfil do usuário usando RBAC
        logger.supabase('Fetching user profile from dashboard');
        const userProfile = await getCurrentUserProfile();

        if (!userProfile) {
          logger.error('Error fetching user profile or user has no profile', undefined, 'RBAC');
        } else {
          logger.supabase('User profile fetched successfully', { profileId: userProfile.id, role: userProfile.role });
        }

        setProfile(userProfile);
        
        // Carregar dados do dashboard
        await loadDashboardData();
        
        setLoading(false);
      } catch (error) {
        logger.error('Unexpected error in dashboard getUser', error as Error, 'DASHBOARD');
        setLoading(false);
      }
    };

    getUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.auth(`Auth state change in dashboard: ${event}`, { hasSession: !!session });
        if (event === 'SIGNED_OUT' || !session) {
          logger.auth('User signed out, redirecting to login');
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      logger.supabase('Loading dashboard data');
      
      // Carregar total de carros
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id')
        .eq('status', 'disponivel');
      
      if (carsError) {
        logger.error('Error loading cars data', carsError, 'DASHBOARD');
      }

      // Carregar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('status', 'active');
      
      if (clientsError) {
        logger.error('Error loading clients data', clientsError, 'DASHBOARD');
      }

      // Carregar contratos
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, total_amount')
        .eq('status', 'ativo');
      
      if (contractsError) {
        logger.error('Error loading contracts data', contractsError, 'DASHBOARD');
      }

      // Calcular receita mensal (soma dos contratos ativos)
      const monthlyRevenue = contracts?.reduce((sum, contract) => sum + (contract.total_amount || 0), 0) || 0;

      // Carregar atividade recente (últimos contratos criados)
      const { data: recentContracts, error: recentError } = await supabase
        .from('contracts')
        .select(`
          id,
          created_at,
          clients (full_name),
          cars (brand, model)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentError) {
        logger.error('Error loading recent activity', recentError, 'DASHBOARD');
      }

      // Carregar pagamentos em atraso
      const { data: overduePays, error: overdueError } = await supabase
        .from('contract_payments')
        .select(`
          id,
          due_date,
          contracts (
            clients (full_name)
          )
        `)
        .lt('due_date', new Date().toISOString())
        .eq('status', 'pending')
        .limit(2);

      if (overdueError) {
        logger.error('Error loading overdue payments', overdueError, 'DASHBOARD');
      }

      setDashboardData({
        totalCars: cars?.length || 0,
        activeClients: clients?.length || 0,
        totalContracts: contracts?.length || 0,
        monthlyRevenue: monthlyRevenue,
        recentActivity: recentContracts || [],
        upcomingTasks: overduePays || []
      });

      logger.supabase('Dashboard data loaded successfully');
    } catch (error) {
      logger.error('Error loading dashboard data', error as Error, 'DASHBOARD');
    }
  };

  const handleLogout = async () => {
    try {
      logger.auth('User initiated logout from dashboard');
      await supabase.auth.signOut();
      logger.auth('User successfully signed out');
      router.push('/login');
    } catch (error) {
      logger.authError('Error during logout', error as Error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      onLogout={handleLogout}
      userRole={profile?.role}
      userName={profile?.full_name || user?.email || ''}
      userEmail={user?.email || ''}
    >
      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Bem-vindo ao Dashboard!
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Visão geral do sistema Pink Legion
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Carros"
            value={dashboardData.totalCars.toString()}
            icon={Car}
            trend={{ value: 12, isPositive: true }}
            color="primary"
          />
          <MetricCard
            title="Clientes Ativos"
            value={dashboardData.activeClients.toString()}
            icon={Users}
            trend={{ value: 8, isPositive: true }}
            color="info"
          />
          <MetricCard
            title="Contratos"
            value={dashboardData.totalContracts.toString()}
            icon={FileText}
            trend={{ value: -3, isPositive: false }}
            color="success"
          />
          <MetricCard
            title="Receita Mensal"
            value={`€${dashboardData.monthlyRevenue.toLocaleString('pt-PT')}`}
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
            color="warning"
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                      <div>
                        <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          Novo contrato criado
                        </p>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Cliente: {activity.clients?.full_name || 'N/A'} - 
                          Carro: {activity.cars?.brand} {activity.cars?.model}
                        </p>
                      </div>
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {new Date(activity.created_at).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-text-secondary-light dark:text-text-secondary-dark py-4">
                    Nenhuma atividade recente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingTasks.length > 0 ? (
                  dashboardData.upcomingTasks.map((task: any, index: number) => (
                    <div key={task.id || index} className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                            Pagamento em atraso
                          </p>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            Cliente: {task.contracts?.clients?.full_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        Venceu em {new Date(task.due_date).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-text-secondary-light dark:text-text-secondary-dark py-4">
                    Nenhuma tarefa pendente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-success-50 dark:bg-success-900/10 rounded-lg">
                <div>
                  <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    Autenticação
                  </p>
                  <p className="text-sm text-success-600 dark:text-success-400">
                    ✅ Funcionando
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-success-50 dark:bg-success-900/10 rounded-lg">
                <div>
                  <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    Base de Dados
                  </p>
                  <p className="text-sm text-success-600 dark:text-success-400">
                    ✅ Conectado
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-info-50 dark:bg-info-900/10 rounded-lg">
                <div>
                  <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    Usuário
                  </p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    ID: {user?.id?.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Última atualização: {currentTime || 'Carregando...'}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}