"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Bot, 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Settings, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, title: "Basic Info", description: "Agent name and description" },
  { id: 2, title: "Knowledge", description: "Upload files and resources" },
  { id: 3, title: "Personality", description: "Configure tone and APIs" },
  { id: 4, title: "Review", description: "Review and train agent" },
];

export default function CreateAgentModal({ open, onOpenChange }: CreateAgentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    tone: "",
    searchEnabled: true,
    newsEnabled: false,
    expressAgentEnabled: true,
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start training
      setIsTraining(true);
      simulateTraining();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const simulateTraining = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsTraining(false);
          onOpenChange(false);
          // Reset form
          setCurrentStep(1);
          setFormData({
            name: "",
            description: "",
            type: "",
            tone: "",
            searchEnabled: true,
            newsEnabled: false,
            expressAgentEnabled: true,
          });
        }, 1000);
      }
      setTrainingProgress(progress);
    }, 200);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-black">
                Agent Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Customer Support Bot"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="border-2 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-black">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this agent does and its purpose..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="border-2 rounded-xl min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-black">
                Agent Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger className="border-2 rounded-xl">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Customer Support</SelectItem>
                  <SelectItem value="sales">Sales Assistant</SelectItem>
                  <SelectItem value="content">Content Creator</SelectItem>
                  <SelectItem value="general">General Purpose</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">Upload Knowledge Files</h3>
              <p className="text-gray-600 mb-4">
                Drag and drop PDFs, documents, or text files here
              </p>
              <Button variant="outline" className="border-2 rounded-xl">
                Choose Files
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supports PDF, DOC, TXT files up to 10MB each
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-px h-4 bg-gray-300"></div>
                <span className="text-sm text-gray-500">OR</span>
                <div className="w-px h-4 bg-gray-300"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urls" className="text-sm font-medium text-black">
                  Add URLs
                </Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://example.com"
                    className="border-2 rounded-xl"
                  />
                  <Button variant="outline" className="border-2 rounded-xl">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text" className="text-sm font-medium text-black">
                  Paste Text Content
                </Label>
                <Textarea
                  placeholder="Paste any text content here..."
                  className="border-2 rounded-xl min-h-[100px]"
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-sm font-medium text-black">
                Communication Tone
              </Label>
              <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                <SelectTrigger className="border-2 rounded-xl">
                  <SelectValue placeholder="Select communication tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="formal">Formal & Professional</SelectItem>
                  <SelectItem value="techy">Technical & Detailed</SelectItem>
                  <SelectItem value="fun">Fun & Engaging</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">You.com API Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 rounded-xl">
                  <div>
                    <h4 className="font-medium text-black">Search API</h4>
                    <p className="text-sm text-gray-600">Enable web search capabilities</p>
                  </div>
                  <Switch
                    checked={formData.searchEnabled}
                    onCheckedChange={(checked) => handleInputChange("searchEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border-2 rounded-xl">
                  <div>
                    <h4 className="font-medium text-black">News API</h4>
                    <p className="text-sm text-gray-600">Access to latest news and updates</p>
                  </div>
                  <Switch
                    checked={formData.newsEnabled}
                    onCheckedChange={(checked) => handleInputChange("newsEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border-2 rounded-xl">
                  <div>
                    <h4 className="font-medium text-black">Express Agent</h4>
                    <p className="text-sm text-gray-600">Advanced AI reasoning capabilities</p>
                  </div>
                  <Switch
                    checked={formData.expressAgentEnabled}
                    onCheckedChange={(checked) => handleInputChange("expressAgentEnabled", checked)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">Review Your Agent</h3>
              
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-black">{formData.name || "Untitled Agent"}</h4>
                      <p className="text-sm text-gray-600">{formData.description || "No description provided"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{formData.type || "General Purpose"}</Badge>
                      <Badge variant="outline">{formData.tone || "Friendly"}</Badge>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-black">Enabled APIs:</h5>
                      <div className="flex flex-wrap gap-2">
                        {formData.searchEnabled && <Badge className="bg-green-100 text-green-800">Search</Badge>}
                        {formData.newsEnabled && <Badge className="bg-green-100 text-green-800">News</Badge>}
                        {formData.expressAgentEnabled && <Badge className="bg-green-100 text-green-800">Express Agent</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (isTraining) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Training Your Agent</DialogTitle>
            <DialogDescription className="text-center">
              Please wait while we train your AI agent...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="text-center">
              <Bot className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-black">{formData.name}</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{Math.round(trainingProgress)}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
            </div>
            
            <div className="text-center text-sm text-gray-600">
              This may take a few minutes...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>Create New Agent</span>
          </DialogTitle>
          <DialogDescription>
            Follow the steps below to create your AI agent
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between py-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.id 
                  ? "bg-primary border-primary text-white" 
                  : "border-gray-300 text-gray-400"
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? "text-black" : "text-gray-400"
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-4 ${
                  currentStep > step.id ? "bg-primary" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="border-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              {currentStep === 4 ? "Train Agent" : "Next"}
              {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
