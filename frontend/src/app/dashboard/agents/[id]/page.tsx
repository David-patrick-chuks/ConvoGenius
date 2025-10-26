"use client";

import { useState } from "react";
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
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";

// Mock data
const agent = {
  id: 1,
  name: "Customer Support Bot",
  description: "Handles customer inquiries and support tickets",
  avatar: "/bot-1.jpg",
  status: "trained",
  conversations: 1247,
  platforms: ["Website", "Slack"],
  sources: [
    { name: "FAQ.pdf", type: "PDF", size: "2.3 MB" },
    { name: "Product Manual.docx", type: "DOC", size: "1.8 MB" },
    { name: "Support Guidelines.txt", type: "TXT", size: "0.5 MB" },
  ],
  apis: ["Search", "Express Agent"],
};

const mockMessages = [
  {
    id: 1,
    type: "user",
    content: "Hi, I'm having trouble with my order. Can you help me?",
    timestamp: "2:30 PM",
    apiUsed: null,
  },
  {
    id: 2,
    type: "agent",
    content: "Hello! I'd be happy to help you with your order. Could you please provide me with your order number or the email address you used when placing the order?",
    timestamp: "2:30 PM",
    apiUsed: "Express Agent",
  },
  {
    id: 3,
    type: "user",
    content: "My order number is #12345",
    timestamp: "2:31 PM",
    apiUsed: null,
  },
  {
    id: 4,
    type: "agent",
    content: "Thank you! I found your order #12345. It shows that your package was shipped yesterday and is currently in transit. You should receive it within 2-3 business days. Would you like me to send you the tracking information?",
    timestamp: "2:31 PM",
    apiUsed: "Search",
  },
];

export default function AgentChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user" as const,
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      apiUsed: null,
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate agent response
    setTimeout(() => {
      const agentResponse = {
        id: messages.length + 2,
        type: "agent" as const,
        content: "I understand your concern. Let me help you with that. Based on the information provided, I can assist you further.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        apiUsed: "Express Agent",
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
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
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Trained
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
                    <span className="font-medium">2 hours ago</span>
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
                  {agent.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
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
                          <span className="text-xs opacity-70">{msg.timestamp}</span>
                          {showDebug && msg.apiUsed && (
                            <Badge variant="outline" className="text-xs">
                              {msg.apiUsed}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                  >
                    <Send className="w-4 h-4" />
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
