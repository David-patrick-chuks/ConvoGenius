"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Resource } from "@/types/api";
import { cortexDeskApiClient } from "@/utils/api";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  File,
  FileText,
  Filter,
  FolderOpen,
  Grid,
  Image,
  List,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useState } from "react";

// Mock data for resources
const resources = [
  {
    id: 1,
    name: "Customer FAQ.pdf",
    type: "PDF",
    size: "2.3 MB",
    uploadDate: "2024-01-15",
    linkedAgents: ["Customer Support Bot", "Sales Assistant"],
    status: "processed",
  },
  {
    id: 2,
    name: "Product Manual.docx",
    type: "DOC",
    size: "1.8 MB",
    uploadDate: "2024-01-14",
    linkedAgents: ["Customer Support Bot"],
    status: "processing",
  },
  {
    id: 3,
    name: "Company Guidelines.txt",
    type: "TXT",
    size: "0.5 MB",
    uploadDate: "2024-01-13",
    linkedAgents: ["Content Writer", "Customer Support Bot"],
    status: "processed",
  },
  {
    id: 4,
    name: "Training Materials.zip",
    type: "ZIP",
    size: "15.2 MB",
    uploadDate: "2024-01-12",
    linkedAgents: [],
    status: "processed",
  },
  {
    id: 5,
    name: "Logo.png",
    type: "PNG",
    size: "0.8 MB",
    uploadDate: "2024-01-11",
    linkedAgents: ["Content Writer"],
    status: "processed",
  },
  {
    id: 6,
    name: "API Documentation.pdf",
    type: "PDF",
    size: "3.1 MB",
    uploadDate: "2024-01-10",
    linkedAgents: ["Technical Support Bot"],
    status: "processed",
  },
];

const fileTypeIcons = {
  PDF: FileText,
  DOC: FileText,
  TXT: FileText,
  ZIP: File,
  PNG: Image,
  JPG: Image,
  JPEG: Image,
};

const fileTypeColors = {
  PDF: "bg-red-100 text-red-600",
  DOC: "bg-blue-100 text-blue-600",
  TXT: "bg-gray-100 text-gray-600",
  ZIP: "bg-purple-100 text-purple-600",
  PNG: "bg-green-100 text-green-600",
  JPG: "bg-green-100 text-green-600",
  JPEG: "bg-green-100 text-green-600",
};

export default function ResourcesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await cortexDeskApiClient.resources.getResources();
      if (response.success && response.data) {
        setResources(response.data);
      }
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredResources.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredResources.map(r => r.id));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await cortexDeskApiClient.resources.uploadResource(file);
      if (response.success && response.data) {
        setResources(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const response = await cortexDeskApiClient.resources.deleteResource(resourceId);
      if (response.success) {
        setResources(prev => prev.filter(r => r.id !== resourceId));
        setSelectedFiles(prev => prev.filter(id => id !== resourceId));
      }
    } catch (error) {
      console.error("Failed to delete resource:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    const Icon = fileTypeIcons[type as keyof typeof fileTypeIcons] || File;
    return Icon;
  };

  const getFileColor = (type: string) => {
    return fileTypeColors[type as keyof typeof fileTypeColors] || "bg-gray-100 text-gray-600";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Resources</h1>
            <p className="text-gray-400 mt-2">
              Manage your knowledge base files and documents
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
              aria-label="Upload files"
            />
            <Button 
              className="bg-primary hover:bg-primary/90 text-white rounded-xl"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: "Total Files", 
              value: resources.length.toString(), 
              icon: FileText 
            },
            { 
              label: "Total Size", 
              value: resources.reduce((total, r) => {
                const size = parseFloat(r.size);
                return total + (isNaN(size) ? 0 : size);
              }, 0).toFixed(1) + " MB", 
              icon: FolderOpen 
            },
            { 
              label: "Processed", 
              value: resources.filter(r => r.status === "processed").length.toString(), 
              icon: FileText 
            },
            { 
              label: "Processing", 
              value: resources.filter(r => r.status === "processing").length.toString(), 
              icon: FileText 
            },
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

        {/* Search and Filters */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 rounded-xl"
                  />
                </div>
                <Button variant="outline" className="border-2 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 border-2 rounded-xl p-1">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    onClick={() => setViewMode("grid")}
                    className="rounded-lg"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    onClick={() => setViewMode("list")}
                    className="rounded-lg"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Actions */}
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black">
                {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="border-2 rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="border-2 rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Files Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map((resource, index) => {
              const Icon = getFileIcon(resource.type);
              const colorClass = getFileColor(resource.type);
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className={`border-2 hover:border-primary/20 transition-all hover:shadow-lg cursor-pointer ${
                    selectedFiles.includes(resource.id) ? "ring-2 ring-primary" : ""
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-sm text-black truncate">{resource.name}</CardTitle>
                      <CardDescription className="text-xs text-gray-600">
                        {resource.size} • {formatDate(resource.uploadDate)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                          <Badge 
                            variant={resource.status === "processed" ? "default" : "secondary"}
                            className={`text-xs ${
                              resource.status === "processed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {resource.status}
                          </Badge>
                        </div>
                        
                        {resource.linkedAgents.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Linked to:</p>
                            <div className="flex flex-wrap gap-1">
                              {resource.linkedAgents.slice(0, 2).map((agent) => (
                                <Badge key={agent} variant="outline" className="text-xs">
                                  {agent}
                                </Badge>
                              ))}
                              {resource.linkedAgents.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{resource.linkedAgents.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.length === filteredResources.length}
                          onChange={handleSelectAll}
                          className="rounded border-2"
                          aria-label="Select all files"
                        />
                      </th>
                      <th className="text-left p-4 font-medium text-black">Name</th>
                      <th className="text-left p-4 font-medium text-black">Type</th>
                      <th className="text-left p-4 font-medium text-black">Size</th>
                      <th className="text-left p-4 font-medium text-black">Upload Date</th>
                      <th className="text-left p-4 font-medium text-black">Linked Agents</th>
                      <th className="text-left p-4 font-medium text-black">Status</th>
                      <th className="text-left p-4 font-medium text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((resource, index) => {
                      const Icon = getFileIcon(resource.type);
                      const colorClass = getFileColor(resource.type);
                      
                      return (
                        <motion.tr
                          key={resource.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(resource.id)}
                              onChange={() => handleFileSelect(resource.id)}
                              className="rounded border-2"
                              aria-label={`Select ${resource.name}`}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-black">{resource.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-600">{resource.size}</td>
                          <td className="p-4 text-gray-600">{formatDate(resource.uploadDate)}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {resource.linkedAgents.slice(0, 2).map((agent) => (
                                <Badge key={agent} variant="outline" className="text-xs">
                                  {agent}
                                </Badge>
                              ))}
                              {resource.linkedAgents.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{resource.linkedAgents.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant={resource.status === "processed" ? "default" : "secondary"}
                              className={`text-xs ${
                                resource.status === "processed" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {resource.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteResource(resource.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Zone */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-primary/50 transition-colors">
          <CardContent className="p-12 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">Upload New Resources</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Drag and drop files here or click to browse. Supports PDF, DOC, TXT, and image files up to 10MB each.
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
