"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Key, 
  Upload, 
  Save, 
  Eye, 
  EyeOff,
  Trash2,
  Plus,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { cortexDeskApiClient } from "@/utils/api";
import { UserSettings, ApiKey } from "@/types/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john@example.com",
    company: "Acme Corp",
    bio: "AI enthusiast and developer",
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: "light",
    notifications: {
      email: true,
      push: false,
      agentTraining: true,
    },
    privacy: {
      dataAnalytics: true,
      marketingEmails: false,
    },
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiUsage, setApiUsage] = useState({
    requestsToday: 0,
    requestsThisMonth: 0,
    monthlyLimit: 0,
    usagePercentage: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load user settings
      const settingsResponse = await cortexDeskApiClient.settings.getUserSettings();
      if (settingsResponse.success && settingsResponse.data) {
        setUserSettings(settingsResponse.data);
        setTheme(settingsResponse.data.theme);
      }

      // Load API keys
      const apiKeysResponse = await cortexDeskApiClient.settings.getApiKeys();
      if (apiKeysResponse.success && apiKeysResponse.data) {
        setApiKeys(apiKeysResponse.data);
      }

      // Load API usage
      const usageResponse = await cortexDeskApiClient.settings.getApiUsage();
      if (usageResponse.success && usageResponse.data) {
        setApiUsage(usageResponse.data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "api", label: "API Keys", icon: Key },
    { id: "preferences", label: "Preferences", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Key },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await cortexDeskApiClient.settings.updateUserSettings({
        ...userSettings,
        // Add profile data to settings if needed
      });
      if (response.success) {
        // Show success message
        console.log("Profile saved successfully");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddApiKey = async () => {
    const name = prompt("Enter API key name:");
    const key = prompt("Enter API key:");
    
    if (name && key) {
      try {
        const response = await cortexDeskApiClient.settings.addApiKey(name, key);
        if (response.success && response.data) {
          setApiKeys(prev => [...prev, response.data!]);
        }
      } catch (error) {
        console.error("Failed to add API key:", error);
      }
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const response = await cortexDeskApiClient.settings.deleteApiKey(id);
      if (response.success) {
        setApiKeys(prev => prev.filter(key => key.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await cortexDeskApiClient.settings.updateUserSettings(newSettings);
      if (response.success && response.data) {
        setUserSettings(response.data);
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl text-black">Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="border-2 rounded-xl">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-gray-600 mt-2">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-black">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="border-2 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-black">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="border-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-black">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    className="border-2 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-black">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="border-2 rounded-xl min-h-[100px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "api":
        return (
          <motion.div
            key="api"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-black">API Keys</CardTitle>
                    <CardDescription>
                      Manage your You.com API keys and tokens
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddApiKey} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border-2 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-black">{apiKey.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {showApiKeys ? apiKey.key : maskApiKey(apiKey.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKeys(!showApiKeys)}
                            className="h-6 w-6 p-0"
                          >
                            {showApiKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Last used: {apiKey.lastUsed}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={apiKey.status === "active" ? "default" : "secondary"}
                          className={`text-xs ${
                            apiKey.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {apiKey.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl text-black">API Usage</CardTitle>
                <CardDescription>
                  Monitor your API usage and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <h4 className="text-2xl font-bold text-black">{apiUsage.requestsToday.toLocaleString()}</h4>
                    <p className="text-sm text-gray-600">Requests Today</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <h4 className="text-2xl font-bold text-black">{apiUsage.requestsThisMonth.toLocaleString()}</h4>
                    <p className="text-sm text-gray-600">Requests This Month</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <h4 className="text-2xl font-bold text-black">{apiUsage.monthlyLimit.toLocaleString()}</h4>
                    <p className="text-sm text-gray-600">Monthly Limit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "preferences":
        return (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl text-black">Appearance</CardTitle>
                <CardDescription>
                  Customize your dashboard appearance and theme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-black">Theme</h4>
                  <div className="flex space-x-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      className="border-2 rounded-xl"
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      className="border-2 rounded-xl"
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => setTheme("system")}
                      className="border-2 rounded-xl"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-black">Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-black">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <Switch 
                        checked={userSettings.notifications.email}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({
                            notifications: { ...userSettings.notifications, email: checked }
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-black">Push Notifications</p>
                        <p className="text-sm text-gray-600">Browser push notifications</p>
                      </div>
                      <Switch 
                        checked={userSettings.notifications.push}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({
                            notifications: { ...userSettings.notifications, push: checked }
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-black">Agent Training Updates</p>
                        <p className="text-sm text-gray-600">Get notified when agents finish training</p>
                      </div>
                      <Switch 
                        checked={userSettings.notifications.agentTraining}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({
                            notifications: { ...userSettings.notifications, agentTraining: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl text-black">Data & Privacy</CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">Data Analytics</p>
                    <p className="text-sm text-gray-600">Help improve CortexDesk by sharing usage data</p>
                  </div>
                  <Switch 
                    checked={userSettings.privacy.dataAnalytics}
                    onCheckedChange={(checked) => 
                      handleUpdateSettings({
                        privacy: { ...userSettings.privacy, dataAnalytics: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">Marketing Emails</p>
                    <p className="text-sm text-gray-600">Receive product updates and tips</p>
                  </div>
                  <Switch 
                    checked={userSettings.privacy.marketingEmails}
                    onCheckedChange={(checked) => 
                      handleUpdateSettings({
                        privacy: { ...userSettings.privacy, marketingEmails: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl text-black">Change Password</CardTitle>
                <CardDescription>
                  Update your account password for better security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-black">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    className="border-2 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-black">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="border-2 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-black">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="border-2 rounded-xl"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl text-black">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">Enable 2FA</p>
                    <p className="text-sm text-gray-600">Use an authenticator app for additional security</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="outline" className="border-2 rounded-xl">
                  Setup Authenticator
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200">
              <CardHeader>
                <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">Delete Account</p>
                    <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" className="rounded-xl">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2">
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-none transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
