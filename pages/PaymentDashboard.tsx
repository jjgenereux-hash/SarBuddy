import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DonationForm } from '@/components/payment/DonationForm';
import { SubscriptionPlans } from '@/components/payment/SubscriptionPlans';
import { PaymentHistory } from '@/components/payment/PaymentHistory';
import { FundAllocationTracker } from '@/components/payment/FundAllocationTracker';
import { RewardContribution } from '@/components/payment/RewardContribution';
import { DonorDashboard } from '@/components/donor/DonorDashboard';
import { RecurringDonationManager } from '@/components/donor/RecurringDonationManager';
import { DonorRecognition } from '@/components/donor/DonorRecognition';
import { CreditCard, Heart, TrendingUp, Users, DollarSign, Calendar, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
interface Stats {
  totalDonations: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export default function PaymentDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDonations: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  });
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchCurrentSubscription();
  }, []);

  const fetchStats = async () => {
    // Fetch donation stats
    const { data: donations } = await supabase
      .from('donations')
      .select('amount');
    
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active');

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    if (donations && subscriptions && payments) {
      const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      
      setStats({
        totalDonations,
        activeSubscriptions: subscriptions.length,
        monthlyRevenue: subscriptions.length * 9.99, // Simplified calculation
        totalRevenue
      });
    }
    setIsLoading(false);
  };

  const fetchCurrentSubscription = async () => {
    // In a real app, get the current user's subscription
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(name)')
      .eq('status', 'active')
      .single();

    if (data) {
      setCurrentSubscription({
        id: data.id,
        plan_name: data.subscription_plans?.name || 'Unknown',
        status: data.status,
        current_period_end: data.current_period_end,
        cancel_at_period_end: data.cancel_at_period_end
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manage-subscription', {
        body: {
          action: 'portal',
          userId: 'current-user-id'
        }
      });

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment & Donations</h1>
        <p className="text-muted-foreground">
          Support our mission to reunite lost pets with their families
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalDonations.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{currentSubscription.plan_name} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.cancel_at_period_end
                    ? `Cancels on ${format(new Date(currentSubscription.current_period_end), 'MMM d, yyyy')}`
                    : `Renews on ${format(new Date(currentSubscription.current_period_end), 'MMM d, yyyy')}`}
                </p>
              </div>
              <Button onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="donate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="donate">Donate</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="subscribe">Premium</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="dashboard">My Impact</TabsTrigger>
          <TabsTrigger value="recognition">Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="donate">
          <DonationForm />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardContribution />
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringDonationManager />
        </TabsContent>

        <TabsContent value="subscribe">
          <SubscriptionPlans />
        </TabsContent>

        <TabsContent value="allocation">
          <FundAllocationTracker />
        </TabsContent>

        <TabsContent value="dashboard">
          <DonorDashboard />
        </TabsContent>

        <TabsContent value="recognition">
          <DonorRecognition />
        </TabsContent>
      </Tabs>
    </div>
  );
}