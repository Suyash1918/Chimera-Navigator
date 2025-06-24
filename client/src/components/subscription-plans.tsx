import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder_stripe_public_key');

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  interval: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'price_1234567890_monthly',
    name: 'Pro Monthly',
    price: 39,
    interval: 'month',
    features: [
      'Unlimited project analysis',
      'Full AI-powered insights', 
      'Schema modification tools',
      'Priority support',
      'Advanced analytics',
      'Export capabilities'
    ]
  },
  {
    id: 'price_1234567890_quarterly',
    name: 'Pro Quarterly',
    price: 35,
    originalPrice: 39,
    interval: 'month',
    savings: 'Save 10%',
    popular: true,
    features: [
      'Everything in Monthly',
      '10% cost savings',
      'Quarterly billing',
      'Priority features access',
      'Dedicated account manager'
    ]
  },
  {
    id: 'price_1234567890_annual',
    name: 'Pro Annual',
    price: 32.50,
    originalPrice: 39,
    interval: 'month',
    savings: 'Save 17%',
    features: [
      'Everything in Quarterly',
      '17% cost savings', 
      'Annual billing',
      'Early access to new features',
      'Custom integrations',
      'White-label options'
    ]
  }
];

function SubscriptionForm({ priceId, planName }: { priceId: string; planName: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { dbUser } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = useMutation({
    mutationFn: async ({ priceId, paymentMethodId }: { priceId: string; paymentMethodId: string }) => {
      const response = await apiRequest('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, paymentMethodId }),
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.status === 'active') {
        toast({
          title: "Subscription Activated!",
          description: `Welcome to ${planName}! Your account has been upgraded.`,
        });
      } else {
        toast({
          title: "Payment Processing",
          description: "Your subscription is being processed.",
        });
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Subscription Failed",
        description: "Please check your payment details and try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      toast({
        title: "Payment Method Error",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    createSubscription.mutate({
      priceId,
      paymentMethodId: paymentMethod.id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Subscribe to ${planName}`}
      </Button>
    </form>
  );
}

export function SubscriptionPlans() {
  const { dbUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  if (dbUser?.accountTier === 'pro') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Pro Account Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 font-medium">
            ✨ You have unlimited access to all features!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">
          Upgrade to Pro for unlimited project analysis and AI features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {plan.savings && (
                  <Badge variant="secondary">{plan.savings}</Badge>
                )}
              </CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.originalPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    ${plan.originalPrice}
                  </span>
                )}
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => setSelectedPlan(plan.id)}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                Choose {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <SubscriptionForm 
                priceId={selectedPlan}
                planName={pricingPlans.find(p => p.id === selectedPlan)?.name || 'Pro Plan'}
              />
            </Elements>
          </CardContent>
        </Card>
      )}
    </div>
  );
}