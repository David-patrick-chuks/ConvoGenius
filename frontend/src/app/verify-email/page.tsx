"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cortexDeskApiClient } from "@/utils/api";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage('Verification token is required');
      return;
    }
    (async () => {
      setVerifying(true);
      const res = await cortexDeskApiClient.auth.verifyEmail(token);
      setVerifying(false);
      setMessage(res.success ? 'Email verified successfully.' : res.error || 'Verification failed.');
    })();
  }, [token]);

  const handleResend = async () => {
    setLoading(true);
    const res = await cortexDeskApiClient.auth.resendVerificationEmail();
    setLoading(false);
    setMessage(res.success ? 'Verification email sent. Please check your inbox.' : (res.error || 'Failed to resend email'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-6">
      <Card className="max-w-md w-full backdrop-blur-xl bg-white/5 border border-white/10 text-white text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <ShieldCheck className="w-5 h-5" />
            <span>Verify Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifying ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            <>
              <p className="mb-2 text-gray-300">{message}</p>
              {!token && (
                <>
                  <p className="mb-4 text-sm text-gray-400">
                    We just sent a verification link to your email. Please check your inbox and spam/junk folders. 
                    The email may take up to 2 minutes to arrive.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button onClick={handleResend} disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                      {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>) : 'Resend Verification Email'}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/login')} className="rounded-xl border-white/10 text-gray-200 hover:bg-white/10">
                      Go to Login
                    </Button>
                  </div>
                </>
              )}
              {token && (
                <Button onClick={() => router.push('/dashboard')} className="rounded-xl bg-blue-600 hover:bg-blue-700">Continue</Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-10">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
