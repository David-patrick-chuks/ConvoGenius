"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Globe, 
  MessageCircle, 
  Rocket, 
  Twitter, 
  FileText, 
  StickyNote, 
  Mail,
  CheckCircle,
  ExternalLink,
  Copy,
  Settings,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { cortexDeskApiClient } from "@/utils/api";
import { Deployment } from "@/types/api";

const deploymentPlatforms = [
  {
    id: "website",
    name: "Website Embed",
    description: "Embed your agent on any website",
    icon: Globe,
    color: "bg-blue-100 text-blue-600",
    connected: true,
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Deploy as a Telegram bot",
    icon: MessageCircle,
    color: "bg-blue-100 text-blue-600",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Integrate with Slack workspace",
    icon: MessageCircle,
    color: "bg-purple-100 text-purple-600",
    connected: true,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Deploy as a Discord bot",
    icon: MessageCircle,
    color: "bg-indigo-100 text-indigo-600",
    connected: false,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    description: "Automate Twitter interactions",
    icon: Twitter,
    color: "bg-gray-100 text-gray-600",
    connected: false,
  },
  {
    id: "hashnode",
    name: "Hashnode",
    description: "Connect to your Hashnode blog",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Integrate with Notion workspace",
    icon: StickyNote,
    color: "bg-gray-100 text-gray-600",
    connected: false,
  },
  {
    id: "email",
    name: "Email Agent",
    description: "Automated email responses",
    icon: Mail,
    color: "bg-red-100 text-red-600",
    connected: false,
  },
];

export default function DeploymentCenter() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [formData, setFormData] = useState({
    botToken: "",
    workspaceId: "",
    webhookUrl: "",
    apiKey: "",
    email: "",
    campaignName: "",
  });

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    try {
      setLoading(true);
      const response = await cortexDeskApiClient.deployments.getDeployments();
      if (response.success && response.data) {
        setDeployments(response.data);
      }
    } catch (error) {
      console.error("Failed to load deployments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformClick = (platformId: string) => {
    setSelectedPlatform(platformId);
    setDeploymentModalOpen(true);
  };

  const handleDeploy = async () => {
    if (!selectedPlatform) return;

    setDeploying(true);
    try {
      const deploymentConfig = {
        platform: selectedPlatform,
        config: formData,
      };

      const response = await cortexDeskApiClient.deployments.createDeployment(deploymentConfig);
      if (response.success && response.data) {
        setDeployments(prev => [...prev, response.data!]);
        setDeploymentModalOpen(false);
        setFormData({
          botToken: "",
          workspaceId: "",
          webhookUrl: "",
          apiKey: "",
          email: "",
          campaignName: "",
        });
      }
    } catch (error) {
      console.error("Failed to deploy:", error);
    } finally {
      setDeploying(false);
    }
  };

  const renderDeploymentForm = () => {
    switch (selectedPlatform) {
      case "telegram":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-sm font-medium text-black">
                Bot Token
              </Label>
              <Input
                id="botToken"
                placeholder="Enter your Telegram bot token"
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                className="border-2 rounded-xl"
              />
              <p className="text-xs text-gray-500">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>
          </div>
        );

      case "slack":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceId" className="text-sm font-medium text-black">
                Workspace ID
              </Label>
              <Input
                id="workspaceId"
                placeholder="Enter your Slack workspace ID"
                value={formData.workspaceId}
                onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                className="border-2 rounded-xl"
              />
            </div>
            <Button variant="outline" className="w-full border-2 rounded-xl">
              Authorize with Slack
            </Button>
          </div>
        );

      case "discord":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-sm font-medium text-black">
                Bot Token
              </Label>
              <Input
                id="botToken"
                placeholder="Enter your Discord bot token"
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                className="border-2 rounded-xl"
              />
            </div>
            <Button variant="outline" className="w-full border-2 rounded-xl">
              Authorize Discord Server
            </Button>
          </div>
        );

      case "twitter":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium text-black">
                Twitter API Key
              </Label>
              <Input
                id="apiKey"
                placeholder="Enter your Twitter API key"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="border-2 rounded-xl"
              />
            </div>
            <Button variant="outline" className="w-full border-2 rounded-xl">
              Connect Twitter Account
            </Button>
          </div>
        );

      case "website":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl" className="text-sm font-medium text-black">
                Website URL
              </Label>
              <Input
                id="webhookUrl"
                placeholder="https://yourwebsite.com"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                className="border-2 rounded-xl"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-black mb-2">Embed Code</h4>
              <Textarea
                value={`<script src="https://cortexdesk.com/embed/agent-123.js"></script>`}
                readOnly
                className="text-xs font-mono border-2 rounded-xl"
              />
              <Button size="sm" variant="outline" className="mt-2 border-2 rounded-xl">
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Select a platform to configure deployment</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Deployment Center</h1>
            <p className="text-gray-600 mt-2">
              Deploy your AI agents across multiple platforms and channels
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              2 Connected
            </Badge>
          </div>
        </div>

        {/* Deployment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deploymentPlatforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`border-2 hover:border-primary/20 transition-all hover:shadow-lg cursor-pointer ${
                  platform.connected ? "ring-2 ring-green-200" : ""
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {platform.connected && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg text-black">{platform.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {platform.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {platform.connected ? (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-2 rounded-xl"
                            onClick={() => handlePlatformClick(platform.id)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-2 rounded-xl"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl"
                          onClick={() => handlePlatformClick(platform.id)}
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Connected Platforms Summary */}
        {deployments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-black mb-6">Active Deployments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deployments.map((deployment) => {
                const platform = deploymentPlatforms.find(p => p.id === deployment.platform);
                if (!platform) return null;
                
                const Icon = platform.icon;
                return (
                  <Card key={deployment.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-black">{platform.name}</h3>
                            <p className="text-sm text-gray-600">
                              {deployment.status === "active" ? "Active deployment" : "Inactive deployment"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            deployment.status === "active" ? "text-green-600" : "text-gray-600"
                          }`}>
                            {deployment.status === "active" ? "Live" : "Inactive"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {deployment.stats.totalChats} chats
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1 border-2 rounded-xl">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm" className="border-2 rounded-xl">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deployment Modal */}
      <Dialog open={deploymentModalOpen} onOpenChange={setDeploymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Rocket className="w-5 h-5 text-primary" />
              <span>Deploy to {deploymentPlatforms.find(p => p.id === selectedPlatform)?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Configure your agent deployment for this platform
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {renderDeploymentForm()}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDeploymentModalOpen(false)}
              className="border-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeploy}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl"
              disabled={deploying}
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Deploy Agent"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
