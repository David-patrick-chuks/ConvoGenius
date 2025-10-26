"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Copy, 
  ExternalLink, 
  Eye, 
  MessageCircle, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Share2,
  Link as LinkIcon,
  Globe,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";

// Mock data for shared agents
const sharedAgents = [
  {
    id: 1,
    name: "Customer Support Bot",
    avatar: "/bot-1.jpg",
    publicUrl: "https://cortexdesk.com/chat/support-bot-123",
    embedCode: `<script src="https://cortexdesk.com/embed/support-bot-123.js"></script>`,
    totalChats: 1247,
    lastActivity: "2 hours ago",
    platforms: ["Website", "Slack"],
    status: "active",
    analytics: {
      totalViews: 15420,
      uniqueVisitors: 8934,
      avgResponseTime: "1.2s",
      satisfactionRate: 94.2,
    },
  },
  {
    id: 2,
    name: "Content Writer",
    avatar: "/bot-2.jpg",
    publicUrl: "https://cortexdesk.com/chat/content-writer-456",
    embedCode: `<script src="https://cortexdesk.com/embed/content-writer-456.js"></script>`,
    totalChats: 892,
    lastActivity: "1 day ago",
    platforms: ["Discord", "Twitter"],
    status: "active",
    analytics: {
      totalViews: 8765,
      uniqueVisitors: 4321,
      avgResponseTime: "2.1s",
      satisfactionRate: 87.5,
    },
  },
];

export default function ShareLinksPage() {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [key]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const generateNewLink = (agentId: number) => {
    // Handle generating new share link
    console.log("Generating new link for agent:", agentId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Share & Links</h1>
            <p className="text-gray-600 mt-2">
              Manage your agent's public links and track engagement analytics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-2">
              <Globe className="w-3 h-3 mr-1" />
              2 Public Agents
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Views", value: "24,185", icon: Eye, change: "+12%" },
            { label: "Unique Visitors", value: "13,255", icon: TrendingUp, change: "+8%" },
            { label: "Total Chats", value: "2,139", icon: MessageCircle, change: "+15%" },
            { label: "Avg Response Time", value: "1.6s", icon: Clock, change: "-0.2s" },
          ].map((stat, index) => {
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

        {/* Shared Agents */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-6">Public Agents</h2>
          <div className="space-y-6">
            {sharedAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>
                            <Globe className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg text-black">{agent.name}</CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            Last activity: {agent.lastActivity}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {agent.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateNewLink(agent.id)}
                          className="border-2 rounded-xl"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          New Link
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Public Link */}
                    <div>
                      <h4 className="font-medium text-black mb-2">Public Chat Link</h4>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={agent.publicUrl}
                          readOnly
                          className="text-sm border-2 rounded-xl"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(agent.publicUrl, `url-${agent.id}`)}
                          className="border-2 rounded-xl"
                        >
                          {copiedStates[`url-${agent.id}`] ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 rounded-xl"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Embed Code */}
                    <div>
                      <h4 className="font-medium text-black mb-2">Embed Code</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-xl border-2">
                          <code className="text-sm font-mono text-gray-800">{agent.embedCode}</code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(agent.embedCode, `embed-${agent.id}`)}
                          className="border-2 rounded-xl"
                        >
                          {copiedStates[`embed-${agent.id}`] ? (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy Embed Code
                        </Button>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div>
                      <h4 className="font-medium text-black mb-4">Analytics Overview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-black">{agent.analytics.totalViews.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Total Views</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-black">{agent.analytics.uniqueVisitors.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Unique Visitors</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-black">{agent.totalChats.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Total Chats</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-black">{agent.analytics.satisfactionRate}%</p>
                          <p className="text-sm text-gray-600">Satisfaction</p>
                        </div>
                      </div>
                    </div>

                    {/* Platform Status */}
                    <div>
                      <h4 className="font-medium text-black mb-2">Deployment Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button variant="outline" className="flex-1 border-2 rounded-xl">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button variant="outline" className="flex-1 border-2 rounded-xl">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" className="border-2 rounded-xl">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Create Share Link</h3>
                <p className="text-gray-600 mb-4">
                  Generate a new public link for any of your agents
                </p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                  Generate Link
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Embed Widget</h3>
                <p className="text-gray-600 mb-4">
                  Get embed code to add your agent to any website
                </p>
                <Button variant="outline" className="w-full border-2 rounded-xl">
                  Get Embed Code
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">View Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Detailed analytics and performance metrics
                </p>
                <Button variant="outline" className="w-full border-2 rounded-xl">
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
