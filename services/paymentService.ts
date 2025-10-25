import { supabase } from '@/lib/supabase';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface FundAllocation {
  category: string;
  percentage: number;
  amount: number;
  description: string;
}

class PaymentService {
  // Process one-time payment
  async processPayment(amount: number, type: 'donation' | 'reward' | 'premium', metadata?: any) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          type,
          amount,
          metadata,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(planId: string, userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          type: 'subscription',
          planId,
          userId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw error;
    }
  }

  // Get fund allocation breakdown
  getFundAllocation(amount: number): FundAllocation[] {
    return [
      {
        category: 'Search Operations',
        percentage: 40,
        amount: amount * 0.4,
        description: 'Drone operations, K9 units, and search equipment'
      },
      {
        category: 'Technology & Infrastructure',
        percentage: 25,
        amount: amount * 0.25,
        description: 'AI development, servers, and platform maintenance'
      },
      {
        category: 'Volunteer Support',
        percentage: 20,
        amount: amount * 0.2,
        description: 'Training, equipment, and volunteer coordination'
      },
      {
        category: 'Community Outreach',
        percentage: 10,
        amount: amount * 0.1,
        description: 'Education programs and awareness campaigns'
      },
      {
        category: 'Administrative',
        percentage: 5,
        amount: amount * 0.05,
        description: 'Operations and administrative costs'
      }
    ];
  }

  // Get payment history
  async getPaymentHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Get subscription status
  async getSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manage-subscription', {
        body: {
          action: 'cancel',
          subscriptionId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(customerId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manage-subscription', {
        body: {
          action: 'update_payment',
          customerId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Payment method update error:', error);
      throw error;
    }
  }

  // Get donation statistics
  async getDonationStats() {
    try {
      const { data: donations, error } = await supabase
        .from('donations')
        .select('amount, created_at');

      if (error) throw error;

      const totalRaised = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const donorCount = new Set(donations?.map(d => d.donor_id)).size;
      
      // Calculate monthly average
      const now = new Date();
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      const recentDonations = donations?.filter(d => 
        new Date(d.created_at) > sixMonthsAgo
      ) || [];
      const monthlyAverage = recentDonations.length > 0 
        ? recentDonations.reduce((sum, d) => sum + d.amount, 0) / 6 
        : 0;

      return {
        totalRaised,
        donorCount,
        monthlyAverage,
        recentDonations: recentDonations.length
      };
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();