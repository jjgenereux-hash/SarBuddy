import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyEmail() {
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already verified
    if (profile?.email_verified) {
      setVerified(true);
      setTimeout(() => navigate('/'), 2000);
    }
  }, [profile, navigate]);

  const handleResendVerification = async () => {
    setResending(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || ''
      });
      
      if (error) throw error;
      
      alert('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const checkVerification = async () => {
    setVerifying(true);
    try {
      await supabase.auth.refreshSession();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email_verified')
        .eq('user_id', user?.id)
        .single();
      
      if (profile?.email_verified) {
        setVerified(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Email not verified yet. Please check your inbox.');
      }
    } catch (err: any) {
      setError('Failed to check verification status');
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Email Verified!</CardTitle>
            <CardDescription className="text-center">
              Redirecting you to the dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to {user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Please check your email and click the verification link to activate your account.
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={checkVerification}
              className="w-full"
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  I've Verified My Email
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </div>
          
          <p className="text-sm text-center text-gray-600">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}