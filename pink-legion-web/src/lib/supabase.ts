import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const error = new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  logger.error('Supabase URL environment variable missing', error, 'SUPABASE_INIT');
  throw error;
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const error = new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  logger.error('Supabase anon key environment variable missing', error, 'SUPABASE_INIT');
  throw error;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

logger.info('Initializing Supabase client', 'SUPABASE_INIT', {
  url: supabaseUrl,
  keyPrefix: supabaseKey.substring(0, 10) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Adicionar listeners para eventos de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  logger.auth(`Auth state changed: ${event}`, {
    event,
    userId: session?.user?.id,
    email: session?.user?.email,
    hasSession: !!session
  });
});

// Função para logar operações do Supabase
export function logSupabaseOperation(table: string, operation: string, data?: unknown) {
  logger.supabase(`${operation.toUpperCase()} operation on ${table}`, { 
    table, 
    operation, 
    data: operation === 'select' ? undefined : data 
  });
}

// Tipos TypeScript para o banco de dados
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'comercial' | 'financeiro'
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'comercial' | 'financeiro'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'comercial' | 'financeiro'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cars: {
        Row: {
          id: string
          brand: string
          model: string
          license_plate: string
          year: number
          mileage: number
          color: string
          engine: string
          price: number
          status: 'disponivel' | 'vendido' | 'reservado'
          sold_to: string | null
          sold_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          license_plate: string
          year: number
          mileage: number
          color: string
          engine: string
          price: number
          status?: 'disponivel' | 'vendido' | 'reservado'
          sold_to?: string | null
          sold_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          license_plate?: string
          year?: number
          mileage?: number
          color?: string
          engine?: string
          price?: number
          status?: 'disponivel' | 'vendido' | 'reservado'
          sold_to?: string | null
          sold_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          full_name: string
          cpf: string
          rg: string | null
          birth_date: string | null
          email: string | null
          phone: string
          whatsapp: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          profession: string | null
          monthly_income: number | null
          company: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          cpf: string
          rg?: string | null
          birth_date?: string | null
          email?: string | null
          phone: string
          whatsapp?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          profession?: string | null
          monthly_income?: number | null
          company?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          cpf?: string
          rg?: string | null
          birth_date?: string | null
          email?: string | null
          phone?: string
          whatsapp?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          profession?: string | null
          monthly_income?: number | null
          company?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          client_id: string
          car_id: string
          contract_number: string
          contract_type: 'venda' | 'financiamento'
          total_amount: number
          down_payment: number | null
          financed_amount: number
          installments: number | null
          installment_amount: number | null
          interest_rate: number | null
          status: 'ativo' | 'quitado' | 'cancelado'
          contract_date: string
          first_payment_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          car_id: string
          contract_number: string
          contract_type: 'venda' | 'financiamento'
          total_amount: number
          down_payment?: number | null
          financed_amount: number
          installments?: number | null
          installment_amount?: number | null
          interest_rate?: number | null
          status?: 'ativo' | 'quitado' | 'cancelado'
          contract_date?: string
          first_payment_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          car_id?: string
          contract_number?: string
          contract_type?: 'venda' | 'financiamento'
          total_amount?: number
          down_payment?: number | null
          financed_amount?: number
          installments?: number | null
          installment_amount?: number | null
          interest_rate?: number | null
          status?: 'ativo' | 'quitado' | 'cancelado'
          contract_date?: string
          first_payment_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          contract_id: string
          installment_number: number
          amount: number
          due_date: string
          payment_date: string | null
          status: 'pendente' | 'pago' | 'atrasado'
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          installment_number: number
          amount: number
          due_date: string
          payment_date?: string | null
          status?: 'pendente' | 'pago' | 'atrasado'
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          installment_number?: number
          amount?: number
          due_date?: string
          payment_date?: string | null
          status?: 'pendente' | 'pago' | 'atrasado'
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          type: 'contrato' | 'documento_cliente' | 'documento_veiculo' | 'comprovante_pagamento' | 'outros'
          file_path: string
          file_size: number | null
          mime_type: string | null
          related_id: string | null
          related_type: 'client' | 'car' | 'contract' | 'payment' | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'contrato' | 'documento_cliente' | 'documento_veiculo' | 'comprovante_pagamento' | 'outros'
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          related_id?: string | null
          related_type?: 'client' | 'car' | 'contract' | 'payment' | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'contrato' | 'documento_cliente' | 'documento_veiculo' | 'comprovante_pagamento' | 'outros'
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          related_id?: string | null
          related_type?: 'client' | 'car' | 'contract' | 'payment' | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      sales_report: {
        Row: {
          contract_id: string
          contract_date: string
          total_price: number
          down_payment: number
          financed_amount: number
          contract_status: string
          brand: string
          model: string
          year: number
          license_plate: string
          client_name: string
          client_email: string
          created_by_name: string | null
        }
      }
      pending_payments: {
        Row: {
          payment_id: string
          installment_number: number
          amount: number
          due_date: string
          status: string
          contract_id: string
          client_name: string
          client_phone: string
          brand: string
          model: string
          license_plate: string
          payment_status_description: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_comercial_or_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_financeiro_or_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      generate_installments: {
        Args: {
          p_contract_id: string
          p_installments: number
          p_installment_amount: number
          p_first_due_date: string
        }
        Returns: void
      }
    }
  }
}