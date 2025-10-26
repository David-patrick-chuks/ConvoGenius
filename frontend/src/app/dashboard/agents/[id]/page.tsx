"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Send, 
  Rocket, 
  Edit, 
  Share2, 
  Settings,
  MessageCircle,
  FileText,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { cortexDeskApiClient } from "@/utils/api";
import { Agent, ChatMessage } from "@/types/api";
import { useParams } from "next/navigation";

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.id as string;
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadAgentAndMessages();
  }, [agentId]);

  const loadAgentAndMessages = async () => {
    try {
      setLoading(true);
      
      // Load agent details
      const agentResponse = await cortexDeskApiClient.agents.getAgent(agentId);
      if (agentResponse.success && agentResponse.data) {
        setAgent(agentResponse.data);
      }

      // Load chat messages
      const messagesResponse = await cortexDeskApiClient.chat.getMessages(agentId);
      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data);
      }
    } catch (error) {
      console.error("Failed to load agent and messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !agentId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      agentId: agentId,
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setSending(true);

    try {
      const response = await cortexDeskApiClient.chat.sendMessage({
        agentId: agentId,
        message: message,
      });

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading agent...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black mb-2">Agent not found</h2>
            <p className="text-gray-600">The agent you're looking for doesn't exist.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Sidebar - Agent Info */}
        <div className="lg:col-span-3">
          <Card className="h-full border-2">
            <CardHeader className="pb-4">
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
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-medium text-black mb-2">Status</h4>
                <Badge className={`${
                  agent.status === "trained" 
                    ? "bg-green-100 text-green-800" 
                    : agent.status === "training"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
              </div>

              {/* Stats */}
              <div>
                <h4 className="font-medium text-black mb-2">Statistics</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Conversations:</span>
                    <span className="font-medium">{agent.conversations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Active:</span>
                    <span className="font-medium">{agent.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Platforms */}
              <div>
                <h4 className="font-medium text-black mb-2">Deployed On</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.platforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Knowledge Sources */}
              <div>
                <h4 className="font-medium text-black mb-2">Knowledge Sources</h4>
                <div className="space-y-2">
                  {agent.sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-black">{source.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{source.size}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* APIs */}
              <div>
                <h4 className="font-medium text-black mb-2">Enabled APIs</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.apis.map((api) => (
                    <Badge key={api} className="bg-blue-100 text-blue-800 text-xs">
                      {api}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Chat */}
        <div className="lg:col-span-6">
          <Card className="h-full border-2 flex flex-col">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg text-black">Chat with {agent.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="border-2 rounded-xl"
                  >
                    Debug
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] ${
                        msg.type === "user" 
                          ? "bg-primary text-white" 
                          : "bg-white text-black border-2"
                      } rounded-2xl p-4 shadow-sm`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {showDebug && msg.apiUsed && (
                            <Badge variant="outline" className="text-xs">
                              {msg.apiUsed}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {sending && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white text-black border-2 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Agent is typing...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div className="p-6 border-t bg-white">
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border-2 rounded-xl"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sending}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Actions */}
        <div className="lg:col-span-3">
          <Card className="h-full border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-black">Actions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Agent
              </Button>

              <Button variant="outline" className="w-full border-2 rounded-xl">
                <Edit className="w-4 h-4 mr-2" />
                Edit Configuration
              </Button>

              <Button variant="outline" className="w-full border-2 rounded-xl">
                <Settings className="w-4 h-4 mr-2" />
                Agent Settings
              </Button>

              <Separator />

              <div>
                <h4 className="font-medium text-black mb-3">Share Agent</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      value="https://cortexdesk.com/chat/agent-123"
                      readOnly
                      className="text-xs border-2 rounded-xl"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("https://cortexdesk.com/chat/agent-123")}
                      className="border-2 rounded-xl"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full border-2 rounded-xl">
                    <Share2 className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-black mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-medium">1.2s avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Rating:</span>
                    <span className="font-medium text-yellow-600">4.8/5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
