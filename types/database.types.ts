export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          risk_tolerance: 'conservative' | 'balanced' | 'aggressive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          risk_tolerance?: 'conservative' | 'balanced' | 'aggressive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          risk_tolerance?: 'conservative' | 'balanced' | 'aggressive'
          created_at?: string
          updated_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      holdings: {
        Row: {
          id: string
          portfolio_id: string
          ticker: string
          shares: number
          average_buy_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          ticker: string
          shares: number
          average_buy_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          ticker?: string
          shares?: number
          average_buy_price?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
