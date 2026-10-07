/**
 * Portfolio & Holding TypeScript Interfaces
 * Used for SimpleInvest Phase 3 Frontend Shell, Recharts & Groq Jargon Buster.
 */

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  ticker: string;
  shares: number;
  average_buy_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface HoldingInput {
  ticker: string;
  invested_amount: number;
}

export interface PortfolioAuditRequest {
  holdings: HoldingInput[];
}

export interface HoldingAuditDetail {
  ticker: string;
  company_name: string;
  invested_amount: number;
  current_value: number;
  weight_percentage: number;
  sector: string;
  risk_vibe: 'Smooth Ride' | 'Moderate Bumps' | 'Rollercoaster' | 'Wild Ride' | string;
}

export interface PortfolioAuditResponse {
  total_invested_amount: number;
  total_current_value: number;
  holdings_count: number;
  sector_breakdown: Record<string, number>;
  portfolio_risk_vibe: string;
  diversification_score: number; // 1 to 100
  plain_english_summary: string;
  concentration_warning: string;
  actionable_takeaways: string[];
  holdings_detail: HoldingAuditDetail[];
}

export interface AddAssetFormInput {
  ticker: string;
  shares: number;
  buyPrice: number;
}

export interface SectorDataItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export type RiskVibeCategory = 'Smooth Ride' | 'Moderate Bumps' | 'Rollercoaster' | 'Wild Ride';

export interface RiskVibeConfig {
  label: RiskVibeCategory;
  range: string;
  score: number; // 0 to 100 for visual gauge
  color: string;
  badgeBg: string;
  badgeText?: string;
  borderColor: string;
  description: string;
  metaphor: string;
}
