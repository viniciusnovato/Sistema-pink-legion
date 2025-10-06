import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tipos TypeScript para o banco de dados (mesmo do web)
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
          address: string
          phone: string
          email: string
          nif: string
          citizen_card: string
          passport: string | null
          iban: string
          bank_name: string | null
          account_holder: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          address: string
          phone: string
          email: string
          nif: string
          citizen_card: string
          passport?: string | null
          iban: string
          bank_name?: string | null
          account_holder?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          address?: string
          phone?: string
          email?: string
          nif?: string
          citizen_card?: string
          passport?: string | null
          iban?: string
          bank_name?: string | null
          account_holder?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          car_id: string
          client_id: string
          total_price: number
          down_payment: number
          financed_amount: number
          installments_count: number
          installment_value: number
          status: 'gerado' | 'assinado' | 'concluido' | 'cancelado'
          contract_pdf_url: string | null
          signed_contract_url: string | null
          contract_date: string
          signed_at: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          car_id: string
          client_id: string
          total_price: number
          down_payment?: number
          installments_count?: number
          installment_value?: number
          status?: 'gerado' | 'assinado' | 'concluido' | 'cancelado'
          contract_pdf_url?: string | null
          signed_contract_url?: string | null
          contract_date?: string
          signed_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          client_id?: string
          total_price?: number
          down_payment?: number
          installments_count?: number
          installment_value?: number
          status?: 'gerado' | 'assinado' | 'concluido' | 'cancelado'
          contract_pdf_url?: string | null
          signed_contract_url?: string | null
          contract_date?: string
          signed_at?: string | null
          completed_at?: string | null
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
          status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
          payment_method: 'transferencia' | 'dinheiro' | 'cheque' | 'cartao' | null
          payment_reference: string | null
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
          status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
          payment_method?: 'transferencia' | 'dinheiro' | 'cheque' | 'cartao' | null
          payment_reference?: string | null
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
          status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
          payment_method?: 'transferencia' | 'dinheiro' | 'cheque' | 'cartao' | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          car_id: string | null
          client_id: string | null
          contract_id: string | null
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          mime_type: string
          category: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          car_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          mime_type: string
          category: string
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          mime_type?: string
          category?: string
          uploaded_by?: string | null
          created_at?: string
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
        Args: {}
        Returns: boolean
      }
      is_comercial_or_admin: {
        Args: {}
        Returns: boolean
      }
      is_financeiro_or_admin: {
        Args: {}
        Returns: boolean
      }
      generate_installments: {
        Args: {
          p_contract_id: string
          p_installments_count: number
          p_installment_value: number
          p_first_due_date: string
        }
        Returns: void
      }
    }
  }
}