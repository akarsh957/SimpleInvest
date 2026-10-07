import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  getOrCreateDefaultPortfolio,
  getUserPortfolios,
  getPortfolioHoldings,
} from '@/src/actions/portfolio';
import { DashboardClient } from '@/src/components/dashboard/DashboardClient';
import { Holding } from '@/src/types/portfolio';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  // Fetch portfolios & initial active portfolio holdings
  const portfolios = await getUserPortfolios();
  const activePortfolio = await getOrCreateDefaultPortfolio();

  let initialHoldings: Holding[] = [];
  if (activePortfolio) {
    initialHoldings = await getPortfolioHoldings(activePortfolio.id);
  }

  const allPortfolios = portfolios.length > 0 ? portfolios : activePortfolio ? [activePortfolio] : [];

  return (
    <DashboardClient
      userEmail={user.email || profile?.email || 'investor@simpleinvest.ai'}
      userName={profile?.full_name || user.user_metadata?.full_name || 'Beginner Investor'}
      initialPortfolios={allPortfolios}
      initialActivePortfolio={activePortfolio}
      initialHoldings={initialHoldings}
    />
  );
}
