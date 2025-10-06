import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface DashboardScreenProps {
  onLogout: () => void;
}

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        onLogout();
        return;
      }

      setUser(user);

      // Buscar perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else {
        setProfile(profile);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          onLogout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onLogout]);

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            onLogout();
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#dc2626'; // red-600
      case 'financeiro':
        return '#059669'; // green-600
      case 'comercial':
        return '#2563eb'; // blue-600
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'financeiro':
        return 'Financeiro';
      case 'comercial':
        return 'Comercial';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Pink Legion</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {profile?.full_name || user?.email || 'Usuário'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile?.role && (
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(profile.role) }]}>
                {getRoleLabel(profile.role)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Bem-vindo ao Dashboard!</Text>
        <Text style={styles.welcomeSubtitle}>
          Sistema de gestão Pink Legion está funcionando corretamente.
        </Text>

        {/* Info Cards */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: '#ec4899' }]}>
              <Text style={styles.cardIconText}>U</Text>
            </View>
            <Text style={styles.cardLabel}>Usuário Ativo</Text>
            <Text style={styles.cardValue}>
              {profile?.full_name || 'Usuário'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: '#059669' }]}>
              <Text style={styles.cardIconText}>✓</Text>
            </View>
            <Text style={styles.cardLabel}>Status</Text>
            <Text style={styles.cardValue}>Conectado</Text>
          </View>

          <View style={styles.card}>
            <View style={[
              styles.cardIcon, 
              { backgroundColor: getRoleColor(profile?.role || '') }
            ]}>
              <Text style={styles.cardIconText}>
                {profile?.role === 'admin' ? 'A' :
                 profile?.role === 'financeiro' ? 'F' : 'C'}
              </Text>
            </View>
            <Text style={styles.cardLabel}>Função</Text>
            <Text style={styles.cardValue}>
              {getRoleLabel(profile?.role || '')}
            </Text>
          </View>
        </View>

        {/* System Info */}
        <View style={styles.systemInfo}>
          <Text style={styles.systemInfoTitle}>Informações do Sistema</Text>
          <Text style={styles.systemInfoText}>
            ✅ Autenticação Supabase funcionando corretamente
          </Text>
          <Text style={styles.systemInfoText}>
            ID do usuário: {user?.id}
          </Text>
          <Text style={styles.systemInfoText}>
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // gray-50
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  cardsContainer: {
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  systemInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  systemInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  systemInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});