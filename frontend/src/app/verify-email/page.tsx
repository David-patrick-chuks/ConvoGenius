"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cortexDeskApiClient } from "@/utils/api";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(()=>{
    (async()=>{
      const res = await cortexDeskApiClient.auth.verifyEmail(token);
      setLoading(false);
      setMessage(res.success ? 'Email verified successfully.' : (res.error || 'Verification failed.'));
    })();
  },[token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-6">
      <Card className="max-w-md w-full backdrop-blur-xl bg-white/5 border border-white/10 text-white text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2"><ShieldCheck className="w-5 h-5"/><span>Verify Email</span></CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center space-x-2"><Loader2 className="w-5 h-5 animate-spin"/><span>Verifying...</span></div>
          ) : (
            <>
              <p className="mb-4 text-gray-300">{message}</p>
              <Button onClick={()=>router.push('/login')} className="rounded-xl bg-blue-600 hover:bg-blue-700">Go to Login</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


