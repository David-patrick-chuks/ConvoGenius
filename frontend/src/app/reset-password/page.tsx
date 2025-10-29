"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cortexDeskApiClient } from "@/utils/api";
import { Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await cortexDeskApiClient.auth.resetPassword(token, password);
    setLoading(false);

    if (res.success) {
      setMessage("Password reset. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMessage(res.error || "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-6">
      <Card className="max-w-md w-full backdrop-blur-xl bg-white/5 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
            {message && <p className="text-sm text-gray-300">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-10">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
