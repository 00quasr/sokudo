import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import type { Metadata } from 'next';

// Prices are fresh for one hour max
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the perfect plan to master developer commands. From free practice to unlimited training with advanced analytics, team features, and AI-generated challenges.',
  openGraph: {
    title: 'Sokudo Pricing - Choose Your Training Plan',
    description: 'Free, Pro, and Elite plans for developer typing training. Start with 15 minutes free or unlock unlimited practice and advanced features.',
    url: '/pricing',
  },
  twitter: {
    title: 'Sokudo Pricing - Choose Your Training Plan',
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Build Your Typing Speed
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master developer commands, git workflows, and terminal shortcuts with muscle memory training
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
    <div className={`relative pt-6 pb-6 px-6 rounded-lg border-2 ${
      popular ? 'border-orange-500 shadow-lg' : 'border-gray-200'
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      {!isFree && trialDays > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          {trialDays} day free trial
        </p>
      )}
      {isFree && (
        <p className="text-sm text-gray-600 mb-4">No credit card required</p>
      )}
      <p className="text-4xl font-medium text-gray-900 mb-6">
        {isFree ? (
          <>
            Free
            <span className="text-xl font-normal text-gray-600 ml-2">
              forever
            </span>
          </>
        ) : (
          <>
            ${price / 100}{' '}
            <span className="text-xl font-normal text-gray-600">
              / {interval}
            </span>
          </>
        )}
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      {isFree ? (
        <a
          href="/sign-up"
          className="block w-full text-center bg-gray-100 text-gray-900 py-3 px-6 rounded-md font-medium hover:bg-gray-200 transition-colors"
        >
          Get Started
        </a>
      ) : (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton popular={popular} />
        </form>
      )}
    </div>
  );
}
