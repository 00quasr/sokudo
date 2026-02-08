import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import Link from 'next/link';
import type { Metadata } from 'next';

// Prices are fresh for one hour max
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the perfect plan to master developer commands. From free practice to unlimited training with advanced analytics, team features, and AI-generated challenges.',
  openGraph: {
    title: 'Hayaku Pricing - Choose Your Training Plan',
    description: 'Free, Pro, and Elite plans for developer typing training. Start with 15 minutes free or unlock unlimited practice and advanced features.',
    url: '/pricing',
  },
  twitter: {
    title: 'Hayaku Pricing - Choose Your Training Plan',
    description: 'Free, Pro, and Elite plans for developer typing training.',
  },
};

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const proPlan = products.find((product) => product.name === 'Pro');
  const elitePlan = products.find((product) => product.name === 'Elite');

  const proPrice = prices.find((price) => price.productId === proPlan?.id);
  const elitePrice = prices.find((price) => price.productId === elitePlan?.id);

  return (
    <main className="min-h-screen bg-[#08090a]">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-medium text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-white/50 max-w-[500px] mx-auto">
            Master developer commands with muscle memory training.
            Start free, upgrade when ready.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price={0}
            interval="forever"
            trialDays={0}
            features={[
              '15 minutes practice per day',
              'Access to 3 basic categories',
              'Track WPM and accuracy',
              'Basic statistics dashboard',
              'Session history',
            ]}
            priceId={undefined}
            isFree={true}
          />
          <PricingCard
            name="Pro"
            price={proPrice?.unitAmount || 900}
            interval={proPrice?.interval || 'month'}
            trialDays={proPrice?.trialPeriodDays || 14}
            features={[
              'Everything in Free, plus:',
              'Unlimited practice time',
              'Access to all 10 categories',
              'Advanced analytics & insights',
              'Keystroke heatmaps',
              'Custom challenges',
              'Achievement system',
              'Weekly progress reports',
            ]}
            priceId={proPrice?.id}
            popular={true}
          />
          <PricingCard
            name="Elite"
            price={elitePrice?.unitAmount || 1900}
            interval={elitePrice?.interval || 'month'}
            trialDays={elitePrice?.trialPeriodDays || 14}
            features={[
              'Everything in Pro, plus:',
              'Team management & leaderboards',
              'Multiplayer typing races',
              'AI-generated practice content',
              'Custom team challenges',
              'Priority support',
              'API access',
              'SSO & SAML integration',
            ]}
            priceId={elitePrice?.id}
          />
        </div>
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  isFree = false,
  popular = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  isFree?: boolean;
  popular?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-8 ${
      popular
        ? 'bg-white/[0.04] ring-1 ring-white/20'
        : 'bg-white/[0.02]'
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-white text-black px-4 py-1 rounded-full text-xs font-medium">
            Most popular
          </span>
        </div>
      )}
      <h2 className="text-xl font-medium text-white">{name}</h2>
      {!isFree && trialDays > 0 && (
        <p className="text-sm text-white/40 mt-1">
          {trialDays} day free trial
        </p>
      )}
      {isFree && (
        <p className="text-sm text-white/40 mt-1">No credit card required</p>
      )}
      <p className="mt-6 flex items-baseline">
        {isFree ? (
          <>
            <span className="text-4xl font-medium text-white">Free</span>
            <span className="text-white/40 ml-2">forever</span>
          </>
        ) : (
          <>
            <span className="text-4xl font-medium text-white">${price / 100}</span>
            <span className="text-white/40 ml-2">/ {interval}</span>
          </>
        )}
      </p>
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-white/40 shrink-0 mt-0.5" />
            <span className="text-white/60 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {isFree ? (
          <Link
            href="/sign-up"
            className="block w-full text-center bg-white/10 text-white py-3 rounded-full font-medium hover:bg-white/20 transition-colors"
          >
            Get started
          </Link>
        ) : (
          <form action={checkoutAction}>
            <input type="hidden" name="priceId" value={priceId} />
            <SubmitButton popular={popular} />
          </form>
        )}
      </div>
    </div>
  );
}
