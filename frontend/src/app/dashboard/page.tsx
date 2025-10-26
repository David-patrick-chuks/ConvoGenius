"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bot, 
  MessageCircle, 
  Rocket, 
  Edit, 
  Share2, 
  Plus,
  TrendingUp,
  Users,
  Clock,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import CreateAgentModal from "@/components/CreateAgentModal";
import { cortexDeskApiClient } from "@/utils/api";
import { Agent } from "@/types/api";

const stats = [
  { label: "Total Agents", value: "12", icon: Bot, change: "+2 this week" },
  { label: "Active Conversations", value: "4,295", icon: MessageCircle, change: "+12% from last week" },
  { label: "Deployments", value: "8", icon: Rocket, change: "+1 this week" },
  { label: "Total Users", value: "1,247", icon: Users, change: "+5% from last week" },
];

export default function DashboardPage() {
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
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
            <h1 className="text-3xl font-bold text-black">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here's what's happening with your AI agents.
            </p>
          </div>
          <Button 
            onClick={() => setCreateAgentOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl"
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
                <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
                        <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
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
            <h2 className="text-2xl font-bold text-black">My Agents</h2>
            <Button variant="outline" className="border-2 rounded-xl">
              View All
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-2 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded"></div>
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
                  <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg h-full">
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
                            <CardTitle className="text-lg text-black">{agent.name}</CardTitle>
                            <CardDescription className="text-sm text-gray-600">
                              {agent.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={agent.status === "trained" ? "default" : "secondary"}
                          className={`${
                            agent.status === "trained" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
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
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last active: {agent.lastActive || "Never"}</span>
                        <span>{agent.conversations.toLocaleString()} conversations</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {agent.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 border-2 rounded-xl">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-2 rounded-xl">
                          <Rocket className="w-4 h-4 mr-2" />
                          Deploy
                        </Button>
                        <Button size="sm" variant="outline" className="border-2 rounded-xl">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-2 rounded-xl">
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
          <h2 className="text-2xl font-bold text-black mb-6">Recent Activity</h2>
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">Customer Support Bot deployed to Slack</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                  <Badge variant="outline">Deployment</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">Content Writer training completed</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Training</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">Sales Assistant reached 1000+ conversations</p>
                    <p className="text-sm text-gray-600">2 days ago</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">Milestone</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
