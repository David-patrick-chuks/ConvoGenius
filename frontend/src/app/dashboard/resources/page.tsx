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
import { Progress } from "@/components/ui/progress";
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
import { toast } from "sonner";

// removed mock data

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await cortexDeskApiClient.resources.getResources();
      if (response.success && response.data) {
        setResources(response.data);
      } else {
        setLoadError(response.error || 'Failed to fetch resources');
        toast.error(response.error || 'Failed to fetch resources');
      }
    } catch (error) {
      setLoadError('Failed to load resources');
      toast.error('Failed to load resources');
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
    setUploadProgress(0);
    try {
      const response = await cortexDeskApiClient.resources.uploadResource(file, undefined, (progress) => {
        setUploadProgress(progress);
      });
      if (response.success && response.data) {
        setResources(prev => [...prev, response.data!]);
        toast.success('File uploaded successfully');
        setUploadProgress(0);
      } else {
        toast.error(response.error || 'Failed to upload file');
      }
    } catch (error: any) {
      console.error("Failed to upload file:", error);
      toast.error(error.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadResource = async (resourceId: string) => {
    try {
      await cortexDeskApiClient.resources.downloadResource(resourceId);
      toast.success('Download started');
    } catch (error) {
      console.error("Failed to download resource:", error);
      toast.error('Failed to download resource');
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
                  Uploading... {Math.round(uploadProgress)}%
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

        {/* Upload Progress */}
        {uploading && (
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Uploading...</span>
                  <span className="text-gray-300">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

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
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
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

        {/* Search and Filters */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <Button variant="outline" className="border border-white/10 text-gray-200 rounded-xl hover:bg-white/10">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 border border-white/10 rounded-xl p-1">
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
          (!loading && resources.length === 0) ? (
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardContent className="p-8 text-center text-gray-300">No resources yet. Upload files to get started.</CardContent>
            </Card>
          ) : (
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
                  <Card className={`backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer ${
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
                            <DropdownMenuItem onClick={() => handleDownloadResource(resource.id)}>
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
                      <CardTitle className="text-sm text-white truncate">{resource.name}</CardTitle>
                      <CardDescription className="text-xs text-gray-400">
                        {resource.size} • {formatDate(resource.uploadDate)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs border-white/10 text-gray-200">
                            {resource.type}
                          </Badge>
                          <Badge 
                            variant={resource.status === "processed" ? "default" : "secondary"}
                            className={`text-xs ${
                              resource.status === "processed" 
                                ? "bg-green-500/20 text-green-300 border border-white/10" 
                                : "bg-yellow-500/20 text-yellow-200 border border-white/10"
                            }`}
                          >
                            {resource.status}
                          </Badge>
                        </div>
                        
                        {resource.linkedAgents.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Linked to:</p>
                            <div className="flex flex-wrap gap-1">
                              {resource.linkedAgents.slice(0, 2).map((agent) => (
                                <Badge key={agent} variant="outline" className="text-xs border-white/10 text-gray-200">
                                  {agent}
                                </Badge>
                              ))}
                              {resource.linkedAgents.length > 2 && (
                                <Badge variant="outline" className="text-xs border-white/10 text-gray-200">
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
          </div>)
        ) : (
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-white/5">
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
                      <th className="text-left p-4 font-medium text-white">Name</th>
                      <th className="text-left p-4 font-medium text-white">Type</th>
                      <th className="text-left p-4 font-medium text-white">Size</th>
                      <th className="text-left p-4 font-medium text-white">Upload Date</th>
                      <th className="text-left p-4 font-medium text-white">Linked Agents</th>
                      <th className="text-left p-4 font-medium text-white">Status</th>
                      <th className="text-left p-4 font-medium text-white">Actions</th>
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
                          className="border-b hover:bg-white/5"
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
                              <span className="font-medium text-white">{resource.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs border-white/10 text-gray-200">
                              {resource.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-400">{resource.size}</td>
                          <td className="p-4 text-gray-400">{formatDate(resource.uploadDate)}</td>
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
                                <DropdownMenuItem onClick={() => handleDownloadResource(resource.id)}>
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
