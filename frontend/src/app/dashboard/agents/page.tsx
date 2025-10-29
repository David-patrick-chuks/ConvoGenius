"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { cortexDeskApiClient } from "@/utils/api";
import { Agent } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, MessageCircle, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AgentsIndexPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
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


