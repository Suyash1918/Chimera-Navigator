import { useAuth } from '@/components/auth-provider';
import { AuthHeader } from '@/components/auth-header';
import { SubscriptionPlans } from '@/components/subscription-plans';

export function SubscriptionPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-600">
              Please sign in to view subscription plans.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      
      <main className="container mx-auto px-4 py-8">
        <SubscriptionPlans />
      </main>
    </div>
  );
}

export default SubscriptionPage;