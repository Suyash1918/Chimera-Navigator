import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccountStatus {
  accountTier: 'free' | 'pro';
  credits: number | null;
  canCreateProject: boolean;
}

export function AccountStatus() {
  const { dbUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: accountStatus, isLoading } = useQuery<AccountStatus>({
    queryKey: [`/api/users/${dbUser?.id}/credits`],
    enabled: !!dbUser?.id,
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/users/${dbUser?.id}/upgrade`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${dbUser?.id}/credits`] });
      toast({
        title: "Account Upgraded!",
        description: "You now have unlimited project access.",
      });
      setIsUpgrading(false);
    },
    onError: (error) => {
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    },
  });

  const handleUpgrade = () => {
    setIsUpgrading(true);
    upgradeMutation.mutate();
  };

  if (isLoading || !accountStatus) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPro = accountStatus.accountTier === 'pro';
  const creditsRemaining = accountStatus.credits || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isPro ? <Crown className="h-5 w-5 text-yellow-500" /> : <Zap className="h-5 w-5" />}
            Account Status
          </span>
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? 'Pro' : 'Free Trial'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPro ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600 font-medium">
              ✨ Unlimited project access
            </p>
            <p className="text-xs text-gray-500">
              Full AI features and unlimited projects
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credits remaining:</span>
              <Badge variant={creditsRemaining > 0 ? "default" : "destructive"}>
                {creditsRemaining}
              </Badge>
            </div>
            
            {creditsRemaining === 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-orange-700">
                  No credits remaining. Upgrade to continue.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full"
                size="sm"
              >
                {isUpgrading ? 'Upgrading...' : 'Upgrade to Pro'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Unlimited projects • Full AI features • Priority support
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}