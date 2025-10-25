import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params first
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          throw new Error(errorDescription || error);
        }

        // Get the code from URL params
        const code = searchParams.get('code');
        
        if (!code) {
          // Check if we have a hash fragment (for implicit flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            // Handle implicit flow
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => navigate('/'), 1500);
            return;
          }
          
          // If no code and no access token, this might be a direct navigation
          // Just redirect to home or login page
          setStatus('success');
          setMessage('Redirecting...');
          setTimeout(() => navigate('/'), 1000);
          return;
        }

        // Exchange code for session
        const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (authError) throw authError;

        if (data?.session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Check if user has a specific role to redirect appropriately
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .single();

          // Redirect based on role
          setTimeout(() => {
            if (profile?.role === 'administrator') {
              navigate('/admin');
            } else if (profile?.role === 'volunteer') {
              navigate('/volunteer');
            } else if (profile?.role === 'pet_owner') {
              navigate('/pet-owner');
            } else {
              navigate('/');
            }
          }, 1500);
        } else {
          throw new Error('No session created');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <h2 className="text-xl font-semibold">Authenticating...</h2>
                <p className="text-gray-600 text-center">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h2 className="text-xl font-semibold">Success!</h2>
                <p className="text-gray-600 text-center">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-semibold">Authentication Failed</h2>
                <p className="text-gray-600 text-center">{message}</p>
                <div className="flex gap-3 mt-4">
                  <Button onClick={() => navigate('/auth/login')}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go Home
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;