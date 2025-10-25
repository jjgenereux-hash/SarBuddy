import { supabase } from '@/lib/supabase';

export interface RateLimitConfig {
  endpoint: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  cooldownPeriod: number;
}

export interface UserQuota {
  userId: string;
  tier: string;
  dailyLimit: number;
  hourlyLimit: number;
  minuteLimit: number;
  currentDailyUsage: number;
  currentHourlyUsage: number;
  currentMinuteUsage: number;
  resetTime: Date;
}

export interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  tier: string;
  limit: number;
  window: 'minute' | 'hour' | 'day';
  burstAllowed: boolean;
  priority: number;
  active: boolean;
}

class RateLimitService {
  private cache = new Map<string, any>();
  private systemLoad = 0;
  private dynamicThrottleMultiplier = 1;

  async checkRateLimit(
    identifier: string,
    endpoint: string,
    type: 'ip' | 'apiKey' | 'user' = 'ip'
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `${type}:${identifier}:${endpoint}`;
    const rule = await this.getRuleForEndpoint(endpoint);
    
    if (!rule) {
      return { allowed: true, remaining: 999, resetAt: new Date() };
    }

    const limit = Math.floor(rule.limit * this.dynamicThrottleMultiplier);
    const usage = await this.getUsage(key, rule.window);
    
    if (usage >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: this.getResetTime(rule.window)
      };
    }

    await this.incrementUsage(key, rule.window);
    
    return {
      allowed: true,
      remaining: limit - usage - 1,
      resetAt: this.getResetTime(rule.window)
    };
  }

  async getUserQuota(userId: string): Promise<UserQuota> {
    const { data } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) {
      return this.getDefaultQuota(userId);
    }

    return data;
  }

  async updateDynamicThrottle(cpuUsage: number, memoryUsage: number) {
    this.systemLoad = (cpuUsage + memoryUsage) / 2;
    
    if (this.systemLoad > 80) {
      this.dynamicThrottleMultiplier = 0.5;
    } else if (this.systemLoad > 60) {
      this.dynamicThrottleMultiplier = 0.75;
    } else {
      this.dynamicThrottleMultiplier = 1;
    }
  }

  async handleBurst(
    identifier: string,
    endpoint: string,
    requestCount: number
  ): Promise<boolean> {
    const rule = await this.getRuleForEndpoint(endpoint);
    
    if (!rule?.burstAllowed) return false;
    
    const burstKey = `burst:${identifier}:${endpoint}`;
    const currentBurst = this.cache.get(burstKey) || 0;
    
    if (currentBurst + requestCount > rule.limit * 2) {
      return false;
    }
    
    this.cache.set(burstKey, currentBurst + requestCount);
    setTimeout(() => this.cache.delete(burstKey), 60000);
    
    return true;
  }

  async createCustomRule(rule: Omit<RateLimitRule, 'id'>): Promise<RateLimitRule> {
    const { data, error } = await supabase
      .from('rate_limit_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getIPRateLimit(ip: string): Promise<{
    requests: number;
    limit: number;
    blocked: boolean;
  }> {
    const key = `ip:${ip}`;
    const requests = this.cache.get(key) || 0;
    const limit = 100; // Per minute
    
    return {
      requests,
      limit,
      blocked: requests >= limit
    };
  }

  async blockIP(ip: string, duration: number = 3600000) {
    const { error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address: ip,
        blocked_until: new Date(Date.now() + duration),
        reason: 'Rate limit exceeded'
      });

    if (!error) {
      this.cache.set(`blocked:${ip}`, true);
      setTimeout(() => this.cache.delete(`blocked:${ip}`), duration);
    }
  }

  async isIPBlocked(ip: string): Promise<boolean> {
    if (this.cache.has(`blocked:${ip}`)) return true;
    
    const { data } = await supabase
      .from('blocked_ips')
      .select('blocked_until')
      .eq('ip_address', ip)
      .gt('blocked_until', new Date().toISOString())
      .single();
    
    return !!data;
  }

  async getScopedRateLimit(apiKey: string, scope: string): Promise<number> {
    const { data } = await supabase
      .from('api_key_scopes')
      .select('rate_limit')
      .eq('api_key', apiKey)
      .eq('scope', scope)
      .single();
    
    return data?.rate_limit || 100;
  }

  private async getRuleForEndpoint(endpoint: string): Promise<RateLimitRule | null> {
    const { data } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .eq('endpoint', endpoint)
      .eq('active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  }

  private async getUsage(key: string, window: string): Promise<number> {
    const cached = this.cache.get(key);
    if (cached) return cached.count;
    
    return 0;
  }

  private async incrementUsage(key: string, window: string) {
    const current = this.cache.get(key) || { count: 0, resetAt: this.getResetTime(window) };
    current.count++;
    this.cache.set(key, current);
    
    // Set TTL based on window
    const ttl = window === 'minute' ? 60000 : window === 'hour' ? 3600000 : 86400000;
    setTimeout(() => this.cache.delete(key), ttl);
  }

  private getResetTime(window: string): Date {
    const now = new Date();
    if (window === 'minute') {
      return new Date(now.getTime() + 60000);
    } else if (window === 'hour') {
      return new Date(now.getTime() + 3600000);
    } else {
      return new Date(now.getTime() + 86400000);
    }
  }

  private getDefaultQuota(userId: string): UserQuota {
    return {
      userId,
      tier: 'free',
      dailyLimit: 1000,
      hourlyLimit: 100,
      minuteLimit: 10,
      currentDailyUsage: 0,
      currentHourlyUsage: 0,
      currentMinuteUsage: 0,
      resetTime: new Date(Date.now() + 86400000)
    };
  }

  getTierLimits(tier: string) {
    // All tiers now have the same unlimited access
    const unlimitedLimits: RateLimitConfig = {
      endpoint: '*',
      tier: 'free',
      requestsPerMinute: 10000,
      requestsPerHour: 100000,
      requestsPerDay: 1000000,
      burstLimit: 1000
    };
    
    return unlimitedLimits;
  }
}

export const rateLimitService = new RateLimitService();