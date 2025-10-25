import { supabase } from '@/lib/supabase';
import { UserRole } from '@/contexts/AuthContext';

export interface SessionInfo {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export interface LoginAttempt {
  email: string;
  ip_address: string;
  success: boolean;
  attempted_at: string;
  error_message?: string;
}

class AuthService {
  // Session Management
  async getSessions(userId: string): Promise<SessionInfo[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }

  async revokeAllSessions(userId: string, exceptCurrent?: string): Promise<void> {
    let query = supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (exceptCurrent) {
      query = query.neq('id', exceptCurrent);
    }

    const { error } = await query;
    if (error) throw error;
  }

  // Login Attempts Tracking
  async logLoginAttempt(attempt: Omit<LoginAttempt, 'attempted_at'>): Promise<void> {
    const { error } = await supabase
      .from('login_attempts')
      .insert({
        ...attempt,
        attempted_at: new Date().toISOString()
      });

    if (error) console.error('Failed to log login attempt:', error);
  }

  async getRecentLoginAttempts(email: string, minutes: number = 30): Promise<LoginAttempt[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .gte('attempted_at', since)
      .order('attempted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const attempts = await this.getRecentLoginAttempts(email, 15);
    const failedAttempts = attempts.filter(a => !a.success);
    return failedAttempts.length >= 5;
  }

  // Two-Factor Authentication
  async enableTwoFactor(userId: string): Promise<{ secret: string; qr_code: string }> {
    const response = await supabase.functions.invoke('auth-2fa/enable', {
      body: { user_id: userId }
    });

    if (response.error) throw response.error;
    return response.data;
  }

  async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    const response = await supabase.functions.invoke('auth-2fa/verify', {
      body: { user_id: userId, code }
    });

    if (response.error) throw response.error;
    return response.data.valid;
  }

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    const response = await supabase.functions.invoke('auth-2fa/disable', {
      body: { user_id: userId, password }
    });

    if (response.error) throw response.error;
  }

  // Role Management
  async changeUserRole(userId: string, newRole: UserRole, adminId: string): Promise<void> {
    const response = await supabase.functions.invoke('admin-change-role', {
      body: { 
        user_id: userId, 
        new_role: newRole,
        admin_id: adminId
      }
    });

    if (response.error) throw response.error;
  }

  // Account Security
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  // Activity Logging
  async logActivity(userId: string, action: string, details?: any): Promise<void> {
    const { error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action,
        details,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });

    if (error) console.error('Failed to log activity:', error);
  }

  // Helper Methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Token Management
  async refreshToken(): Promise<void> {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  }

  async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Account Management
  async deactivateAccount(userId: string, reason?: string): Promise<void> {
    const response = await supabase.functions.invoke('account-deactivate', {
      body: { user_id: userId, reason }
    });

    if (response.error) throw response.error;
  }

  async reactivateAccount(userId: string): Promise<void> {
    const response = await supabase.functions.invoke('account-reactivate', {
      body: { user_id: userId }
    });

    if (response.error) throw response.error;
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const response = await supabase.functions.invoke('account-delete', {
      body: { user_id: userId, password }
    });

    if (response.error) throw response.error;
  }
}

export const authService = new AuthService();