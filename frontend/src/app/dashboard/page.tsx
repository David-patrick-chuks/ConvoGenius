"use client";

import CreateAgentModal from "@/components/CreateAgentModal";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent } from "@/types/api";
import { cortexDeskApiClient } from "@/utils/api";
import { AnalyticsApiClient } from "@/utils/api/analyticsApi";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle,
  Clock,
  Edit,
  MessageCircle,
  Plus,
  Rocket,
  Share2,
  TrendingUp,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const defaultStats = [
  { label: "Total Agents", value: "0", icon: Bot, change: "" },
  { label: "Active Conversations", value: "0", icon: MessageCircle, change: "" },
  { label: "Deployments", value: "0", icon: Rocket, change: "" },
  { label: "Total Users", value: "-", icon: Users, change: "" },
];

export default function DashboardPage() {
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(defaultStats);
  const router = useRouter();

  useEffect(() => {
    loadAgents();
    loadAnalytics();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await cortexDeskApiClient.agents.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await AnalyticsApiClient.getDashboard('30d');
      if (response.success && response.data) {
        const overview = response.data.overview || {};
        setStats([
          { label: 'Total Agents', value: String(overview.totalAgents ?? 0), icon: Bot, change: '' },
          { label: 'Active Conversations', value: String(response.data.conversations?.total ?? 0), icon: MessageCircle, change: '' },
          { label: 'Deployments', value: String(overview.totalTrainingJobs ?? 0), icon: Rocket, change: '' },
          { label: 'Total Users', value: '-', icon: Users, change: '' },
        ]);
      }
    } catch (e) {
      // keep defaults on error
    }
  };

  const handleCreateAgent = async (agentData: any) => {
    try {
      const response = await cortexDeskApiClient.agents.createAgent(agentData);
      if (response.success && response.data) {
        setAgents(prev => [...prev, response.data!]);
        setCreateAgentOpen(false);
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
    }
  }
  return (
    <DashboardLayout>
      <CreateAgentModal open={createAgentOpen} onOpenChange={setCreateAgentOpen} />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Welcome back! Here's what's happening with your AI agents.
            </p>
          </div>
          <Button 
            onClick={() => setCreateAgentOpen(true)}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-white/10">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* My Agents Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Agents</h2>
            <Button variant="outline" className="rounded-xl border-white/10 text-gray-200 hover:bg-white/10">
              View All
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-white/10 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all h-full shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={agent.avatar} />
                            <AvatarFallback>
                              <Bot className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
                            <CardDescription className="text-sm text-gray-400">
                              {agent.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={agent.status === "trained" ? "default" : "secondary"}
                          className={`border-white/10 ${
                            agent.status === "trained" 
                              ? "bg-emerald-500/20 text-emerald-300" 
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {agent.status === "trained" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {agent.status === "trained" ? "Trained" : "In Training"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Last active: {agent.lastActive || "Never"}</span>
                        <span>{agent.conversations.toLocaleString()} conversations</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {agent.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs border-white/10 text-gray-200">
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 rounded-xl border-white/10 text-gray-200 hover:bg-white/10"
                          onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 rounded-xl border-white/10 text-gray-200 hover:bg-white/10"
                          onClick={() => router.push('/dashboard/deployments')}
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Deploy
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl border-white/10 text-gray-200 hover:bg-white/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl border-white/10 text-gray-200 hover:bg-white/10">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Customer Support Bot deployed to Slack</p>
                    <p className="text-sm text-gray-400">2 hours ago</p>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-gray-200">Deployment</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Content Writer training completed</p>
                    <p className="text-sm text-gray-400">1 day ago</p>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-emerald-300">Training</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Sales Assistant reached 1000+ conversations</p>
                    <p className="text-sm text-gray-400">2 days ago</p>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-indigo-300">Milestone</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
