import { getLandingStats } from '@/actions/get-landing-stats';
import LandingPageContent from '@/components/landing/LandingPageContent';

// Force dynamic rendering to ensure stats are fresh on every request
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const stats = await getLandingStats();

  return <LandingPageContent stats={stats} />;
}

