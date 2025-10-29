"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Agent } from "@/types/api";
import { cortexDeskApiClient } from "@/utils/api";
import { Bot, CheckCircle, Copy, MessageCircle, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AgentsIndexPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await cortexDeskApiClient.agents.getAgents();
        if (res.success && res.data) setAgents(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyToClipboard = (text: string, agentId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(agentId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getShareLink = (agentId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${origin}/public/agent/${agentId}`;
  };

  const getEmbedCode = (agentId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `<script src="${backendUrl}/embed/agent/${agentId}.js" data-position="right" data-theme="dark" data-title="Chat" data-primary-color="#2563eb" data-bubble-color="#2563eb"></script>`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">My Agents</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 animate-pulse">
                <CardContent className="p-6"><div className="h-32 bg-white/10 rounded"/></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card key={agent._id} className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={agent.avatar} />
                        <AvatarFallback><Bot className="w-6 h-6" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
                        <p className="text-sm text-gray-400">{agent.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Last active: {agent.lastActive || "Never"}</span>
                    <span>{agent.conversations?.toLocaleString?.() || 0} conversations</span>
                  </div>
                  
                  {/* Share Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">Share Link</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={getShareLink(agent._id)}
                        readOnly
                        className="text-xs rounded-xl bg-white/5 border-white/10 text-gray-100 h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getShareLink(agent._id), `share-${agent._id}`)}
                        className="rounded-xl border-white/10 text-gray-200 hover:bg-white/10 h-8 px-2"
                      >
                        {copiedId === `share-${agent._id}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Embed Code */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">Embed Code</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={getEmbedCode(agent._id)}
                        readOnly
                        className="text-xs rounded-xl bg-white/5 border-white/10 text-gray-100 h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getEmbedCode(agent._id), `embed-${agent._id}`)}
                        className="rounded-xl border-white/10 text-gray-200 hover:bg-white/10 h-8 px-2"
                      >
                        {copiedId === `embed-${agent._id}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl border-white/10 text-gray-200 hover:bg-white/10" onClick={() => router.push(`/dashboard/agents/${agent._id}`)}>
                      <MessageCircle className="w-4 h-4 mr-2"/> Chat
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl border-white/10 text-gray-200 hover:bg-white/10" onClick={() => router.push('/dashboard/deployments')}>
                      <Rocket className="w-4 h-4 mr-2"/> Deploy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


