import { supabase } from '@/lib/supabase';

export interface OAuthProvider {
  name: string;
  displayName: string;
  icon: string;
  scopes: string[];
  color: string;
}

export interface OAuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
  };
}

export interface OAuthConsent {
  client_id: string;
  scopes: string[];
  granted_at: string;
  expires_at?: string;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    name: 'google',
    displayName: 'Google',
    icon: '🔍',
    scopes: ['openid', 'profile', 'email'],
    color: 'bg-red-500'
  },
  {
    name: 'github',
    displayName: 'GitHub',
    icon: '🐙',
    scopes: ['read:user', 'user:email'],
    color: 'bg-gray-800'
  },
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: '🪟',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    color: 'bg-blue-600'
  }
];

class OAuth2Service {
  private readonly redirectUri = `${window.location.origin}/auth/callback`;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  async initiateOAuth(provider: string, scopes?: string[]): Promise<void> {
    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);

    const { data, error } = await supabase.functions.invoke('oauth2-authorize', {
      body: {
        provider,
        redirect_uri: this.redirectUri,
        state,
        scope: scopes?.join(' ')
      }
    });

    if (error) throw error;
    window.location.href = data.authUrl;
  }

  async handleCallback(code: string, state: string, provider: string): Promise<OAuthToken> {
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    const { data, error } = await supabase.functions.invoke('oauth2-token', {
      body: {
        code,
        provider,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      }
    });

    if (error) throw error;

    this.storeTokens(data);
    this.scheduleTokenRefresh(data.expires_in);
    
    return data;
  }

  async refreshToken(): Promise<OAuthToken> {
    const refreshToken = localStorage.getItem('oauth_refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const { data, error } = await supabase.functions.invoke('oauth2-token', {
      body: {
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }
    });

    if (error) throw error;

    this.storeTokens(data);
    this.scheduleTokenRefresh(data.expires_in);
    
    return data;
  }

  async revokeToken(token: string): Promise<void> {
    const { error } = await supabase.functions.invoke('oauth2-revoke', {
      body: { token }
    });

    if (error) throw error;
    this.clearTokens();
  }

  async getUserConsent(userId: string): Promise<OAuthConsent[]> {
    const { data, error } = await supabase
      .from('oauth_consent')
      .select('*')
      .eq('user_id', userId)
      .eq('revoked', false);

    if (error) throw error;
    return data || [];
  }

  async grantConsent(clientId: string, scopes: string[]): Promise<void> {
    const { error } = await supabase
      .from('oauth_consent')
      .upsert({
        client_id: clientId,
        scopes,
        granted_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async revokeConsent(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('oauth_consent')
      .update({ revoked: true })
      .eq('client_id', clientId);

    if (error) throw error;
  }

  async introspectToken(token: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('oauth2-introspect', {
      body: { token }
    });

    if (error) throw error;
    return data;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('oauth_access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private storeTokens(tokens: OAuthToken): void {
    localStorage.setItem('oauth_access_token', tokens.access_token);
    localStorage.setItem('oauth_refresh_token', tokens.refresh_token);
    if (tokens.user) {
      localStorage.setItem('oauth_user', JSON.stringify(tokens.user));
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('oauth_access_token');
    localStorage.removeItem('oauth_refresh_token');
    localStorage.removeItem('oauth_user');
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    const refreshTime = (expiresIn - 300) * 1000; // Refresh 5 minutes before expiry
    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken().catch(console.error);
    }, refreshTime);
  }

  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  logout(): void {
    this.clearTokens();
    sessionStorage.removeItem('oauth_state');
  }
}

export const oauth2Service = new OAuth2Service();