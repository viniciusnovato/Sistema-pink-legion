'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { Car, Plus, Search, Filter, Edit, Trash2, Eye, Upload, Download } from 'lucide-react';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  purchase_price: number;
  sale_price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  color: string;
  status: 'available' | 'sold' | 'reserved' | 'maintenance';
  images?: string[];
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

export default function CarsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCars();
    }
  }, [user]);

  useEffect(() => {
    filterCars();
  }, [cars, searchTerm, statusFilter]);

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

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching cars', error);
        return;
      }

      setCars(data || []);
    } catch (error) {
      logger.error('Error fetching cars', error as Error);
    }
  };

  const filterCars = () => {
    let filtered = cars;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(car =>
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.color.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => car.status === statusFilter);
    }

    setFilteredCars(filtered);
  };

  const handleLogout = async () => {
    try {
      logger.auth('User initiated logout from cars page');
      await supabase.auth.signOut();
      logger.auth('User successfully signed out');
      router.push('/login');
    } catch (error) {
      logger.error('Error during logout', error as Error);
    }
  };

  const handleDeleteCar = async () => {
    if (!carToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carToDelete.id);

      if (error) {
        logger.error('Error deleting car', error);
        return;
      }

      logger.info('Car deleted successfully', 'CARS', { carId: carToDelete.id });
      await fetchCars();
      setShowDeleteModal(false);
      setCarToDelete(null);
    } catch (error) {
      logger.error('Error deleting car', error as Error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'sold':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'sold':
        return 'Vendido';
      case 'reserved':
        return 'Reservado';
      case 'maintenance':
        return 'Manutenção';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-gold-600"></div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Gestão de Carros
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
              Gerencie o inventário de veículos
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/cars/import')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              onClick={() => {/* TODO: Export functionality */}}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              onClick={() => router.push('/dashboard/cars/new')}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Carro
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary h-4 w-4" />
                  <Input
                    placeholder="Pesquisar por marca, modelo ou cor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-bg-light dark:bg-bg-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-rose-gold-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="available">Disponível</option>
                  <option value="sold">Vendido</option>
                  <option value="reserved">Reservado</option>
                  <option value="maintenance">Manutenção</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cars Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2 text-rose-gold-600 dark:text-rose-gold-400" />
              Carros ({filteredCars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCars.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-12 w-12 mx-auto text-text-light-secondary dark:text-text-dark-secondary mb-4" />
                <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Nenhum carro encontrado
                </h3>
                <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  {cars.length === 0 
                    ? 'Comece adicionando seu primeiro carro ao inventário.'
                    : 'Tente ajustar os filtros de pesquisa.'
                  }
                </p>
                {cars.length === 0 && (
                  <Button onClick={() => router.push('/dashboard/cars/new')} className="bg-pink-600 hover:bg-pink-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Carro
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Quilometragem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCars.map((car) => (
                      <TableRow key={car.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                              {car.brand} {car.model}
                            </div>
                            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                              {car.color} • {car.fuel_type} • {car.transmission}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{car.year}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(car.sale_price)}
                        </TableCell>
                        <TableCell>
                          {car.mileage.toLocaleString('pt-PT')} km
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                            {getStatusLabel(car.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/cars/${car.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/cars/${car.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setCarToDelete(car);
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCarToDelete(null);
        }}
      >
        <ModalHeader>
          <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
            Confirmar Exclusão
          </h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Tem certeza que deseja excluir o carro{' '}
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
              {carToDelete?.brand} {carToDelete?.model}
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false);
              setCarToDelete(null);
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteCar}
            loading={isDeleting}
          >
            Excluir
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}