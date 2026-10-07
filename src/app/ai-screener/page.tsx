import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  getOrCreateDefaultPortfolio,
  getUserPortfolios,
} from '@/src/actions/portfolio';
import { AiScreenerClient } from '@/src/components/screener/AiScreenerClient';

export default async function AiScreenerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const portfolios = await getUserPortfolios();
  const activePortfolio = await getOrCreateDefaultPortfolio();
  const allPortfolios = portfolios.length > 0 ? portfolios : activePortfolio ? [activePortfolio] : [];

  return (
    <AiScreenerClient
      userEmail={user.email || profile?.email || 'investor@simpleinvest.ai'}
      userName={profile?.full_name || user.user_metadata?.full_name || 'Institutional Member'}
      initialPortfolios={allPortfolios}
      initialActivePortfolio={activePortfolio}
    />
  );
}
