'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { Users, Plus, Search, Filter, Edit, Trash2, Eye, FileText, Phone, Mail, MapPin, Calendar, CreditCard, Star, TrendingUp, Activity } from 'lucide-react';
import { LoadingSpinner, LoadingOverlay, Skeleton } from '@/components/ui/LoadingSpinner';
import { useBundleAnalyzer } from '@/utils/bundleAnalyzer';
import { LazyAvatar } from '@/components/ui/LazyImage';

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  nif: string | null;
  cc: string | null;
  birth_date: string | null;
  profession: string | null;
  monthly_income: number | null;
  status: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Performance monitoring
  const { measureComponent, generateReport } = useBundleAnalyzer();

  // Computed values for statistics
  // Statistics
  const activeClients = clients.filter(client => client.status === 'active').length;
  const pendingClients = clients.filter(client => client.status === 'pending').length;
  const totalRevenue = clients.reduce((sum, client) => sum + (client.monthly_income || 0), 0);
  const averageIncome = clients.length > 0 ? totalRevenue / clients.length : 0;

  // User info derived from profile
  const userRole = profile?.role || 'Usuário';
  const userName = profile?.full_name || user?.email || 'Usuário';
  const userEmail = user?.email || '';

  useEffect(() => {
    const endMeasure = measureComponent('ClientsPage');
    checkUser();
    
    return () => {
      endMeasure();
      // Gerar relatório de performance
      setTimeout(() => {
        generateReport();
      }, 1000);
    };
  }, [measureComponent, generateReport]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.auth('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(user);
      
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching user profile', error);
      } else {
        setProfile(profile);
      }
    } catch (error) {
      logger.error('Error checking user', error as Error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching clients', error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      logger.error('Error fetching clients', error as Error);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(client =>
                          client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (client.nif && client.nif.includes(searchTerm)) ||
                          client.phone.includes(searchTerm)
                        );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const handleLogout = async () => {
    try {
      logger.auth('User initiated logout from clients page');
      await supabase.auth.signOut();
      logger.auth('User successfully signed out');
      router.push('/login');
    } catch (error) {
      logger.error('Error during logout', error as Error);
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) {
        logger.error('Error deleting client', error);
        return;
      }

      logger.info('Client deleted successfully', 'CLIENTS', { clientId: clientToDelete.id });
      await fetchClients();
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (error) {
      logger.error('Error deleting client', error as Error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClient = (client: Client) => {
    // TODO: Implement edit functionality
    console.log('Edit client:', client);
  };

  // Função para navegar para a página de adicionar cliente
  const handleAddClient = () => {
    router.push('/clients/new')
  }

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'pending':
        return 'Pendente';
      case 'blocked':
        return 'Bloqueado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return 'N/A';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingOverlay 
          isLoading={true}
          message="Carregando dados dos clientes..."
        >
          <div className="min-h-screen" />
        </LoadingOverlay>
      </div>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout} userRole={userRole} userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestão de Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie informações completas dos clientes
            </p>
          </div>
          <Button onClick={handleAddClient} className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Clientes Ativos
                  </p>
                  <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {activeClients}
                  </p>
                </div>
                <div className="h-12 w-12 bg-success-100 dark:bg-success-900/20 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-success-600 dark:text-success-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Pendentes
                  </p>
                  <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                    {pendingClients}
                  </p>
                </div>
                <div className="h-12 w-12 bg-warning-100 dark:bg-warning-900/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Receita Média
                  </p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(averageIncome)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-info-600 dark:text-info-400">
                    {clients.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-info-100 dark:bg-info-900/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-info-600 dark:text-info-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark h-4 w-4" />
                <Input
                  placeholder="Pesquisar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
                <option value="blocked">Bloqueado</option>
              </select>
              <Input
                placeholder="Filtrar por profissão..."
                value=""
                onChange={() => {}}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Clientes ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                  Comece adicionando seu primeiro cliente
                </p>
                <Button onClick={handleAddClient} className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Profissão</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                              {client.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">{client.full_name}</div>
                              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-mono">{client.nif || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-primary-light dark:text-text-primary-dark">{client.profession || 'Não informado'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                              <Mail className="w-4 h-4 mr-2" />
                              {client.email}
                            </div>
                            <div className="flex items-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                              <Phone className="w-4 h-4 mr-2" />
                              {formatPhone(client.phone)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                             {getStatusLabel(client.status)}
                           </span>
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex items-center justify-end space-x-2">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 router.push(`/clients/${client.id}`);
                               }}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 router.push(`/clients/${client.id}`);
                               }}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="destructive"
                               size="sm"
                               onClick={() => {
                                 setClientToDelete(client);
                                 setShowDeleteModal(true);
                               }}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Client Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedClient(null);
        }}
        title="Detalhes do Cliente"
        size="xl"
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">Informações Pessoais</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Nome Completo</label>
                    <p className="text-text-light-primary dark:text-text-dark-primary">{selectedClient.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">NIF</label>
                    <p className="text-text-light-primary dark:text-text-dark-primary font-mono">{selectedClient.nif || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">CC</label>
                    <p className="text-text-light-primary dark:text-text-dark-primary">{selectedClient.cc || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Data de Nascimento</label>
                    <p className="text-text-light-primary dark:text-text-dark-primary">{selectedClient.birth_date ? new Date(selectedClient.birth_date).toLocaleDateString('pt-PT') : 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Contato</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Email</label>
                    <p className="text-text-light-primary dark:text-text-dark-primary">{selectedClient.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Telefone</label>
                    <p className="text-text-light-primary dark:text-text-dark-primary">{formatPhone(selectedClient.phone)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader>
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Confirmar Exclusão
          </h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Tem certeza que deseja excluir o cliente{' '}
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
              {clientToDelete?.full_name}
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteClient}
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
