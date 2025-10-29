"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiKey, UserSettings } from "@/types/api";
import { cortexDeskApiClient } from "@/utils/api";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Key,
  Monitor,
  Moon,
  Plus,
  Save,
  Settings as SettingsIcon,
  Sun,
  Trash2,
  Upload,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{ otpauthUrl: string; base32: string } | null>(null);
  const [twoFAToken, setTwoFAToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
      if (response.success) toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
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
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-400">
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
                    <Button variant="outline" className="border border-white/10 text-gray-200 rounded-xl hover:bg-white/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-gray-400 mt-2">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-300">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-300">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
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
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white">API Keys</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your You.com API keys and tokens
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddApiKey} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{apiKey.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm font-mono bg-black/40 text-gray-200 px-2 py-1 rounded">
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
                        <p className="text-sm text-gray-400 mt-1">
                          Last used: {apiKey.lastUsed}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={apiKey.status === "active" ? "default" : "secondary"}
                          className={`text-xs ${
                            apiKey.status === "active" 
                              ? "bg-green-500/20 text-green-300 border border-white/10" 
                              : "bg-white/10 text-gray-300 border border-white/10"
                          }`}
                        >
                          {apiKey.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">API Usage</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor your API usage and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="text-2xl font-bold text-white">{apiUsage.requestsToday.toLocaleString()}</h4>
                    <p className="text-sm text-gray-400">Requests Today</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="text-2xl font-bold text-white">{apiUsage.requestsThisMonth.toLocaleString()}</h4>
                    <p className="text-sm text-gray-400">Requests This Month</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="text-2xl font-bold text-white">{apiUsage.monthlyLimit.toLocaleString()}</h4>
                    <p className="text-sm text-gray-400">Monthly Limit</p>
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
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Appearance</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize your dashboard appearance and theme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Theme</h4>
                  <div className="flex space-x-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      className="rounded-xl"
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      className="rounded-xl"
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => setTheme("system")}
                      className="rounded-xl"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-white">Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Email Notifications</p>
                        <p className="text-sm text-gray-400">Receive updates via email</p>
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
                        <p className="font-medium text-white">Push Notifications</p>
                        <p className="text-sm text-gray-400">Browser push notifications</p>
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
                        <p className="font-medium text-white">Agent Training Updates</p>
                        <p className="text-sm text-gray-400">Get notified when agents finish training</p>
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
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Change Password</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your account password for better security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-300">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Two-Factor Authentication</CardTitle>
                <CardDescription className="text-gray-400">
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable 2FA</p>
                    <p className="text-sm text-gray-400">Use an authenticator app for additional security</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" className="border border-white/10 text-gray-200 rounded-xl hover:bg-white/10" onClick={async ()=>{
                      const r = await cortexDeskApiClient.settings.setup2FA();
                      if (r.success && r.data) {
                        setTwoFASetup(r.data);
                        const qr = await cortexDeskApiClient.settings.get2FAQr();
                        if (qr.success && qr.data) setQrDataUrl(qr.data.dataUrl);
                      } else {
                        toast.error(r.error || 'Failed to start 2FA setup');
                      }
                    }}>Setup</Button>
                    <Button variant="outline" className="border border-white/10 text-gray-200 rounded-xl hover:bg-white/10" onClick={async ()=>{
                      await cortexDeskApiClient.settings.disable2FA();
                      setTwoFASetup(null); setTwoFAToken(""); setQrDataUrl(null);
                      toast.success('2FA disabled');
                    }}>Disable</Button>
                  </div>
                </div>
                {twoFASetup && (
                  <div className="space-y-3">
                    {qrDataUrl && (
                      <div className="bg-white rounded p-2 w-[180px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="2FA QR" className="w-full h-auto" />
                      </div>
                    )}
                    <p className="text-sm text-gray-300">Secret: <code className="bg-black/40 px-2 py-1 rounded">{twoFASetup.base32}</code></p>
                    <div className="flex space-x-2">
                      <Input placeholder="Enter 6-digit code" value={twoFAToken} onChange={(e)=>setTwoFAToken(e.target.value)} className="rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 w-40" />
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={async ()=>{
                        const res = await cortexDeskApiClient.settings.enable2FA(twoFAToken);
                        if (res.success) { toast.success('2FA enabled'); setTwoFASetup(null); setTwoFAToken(''); setQrDataUrl(null); }
                        else { toast.error(res.error || 'Failed to enable 2FA'); }
                      }}>Verify & Enable</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-xl text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-gray-400">
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Delete Account</p>
                    <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" className="rounded-xl" onClick={()=>setConfirmOpen(true)}>
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
    <>
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
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
                            ? "bg-white/10 text-white border-l-2 border-blue-500"
                            : "text-gray-300 hover:bg-white/5"
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
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm account deletion</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setConfirmOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={async ()=>{
            const r = await cortexDeskApiClient.auth.deleteAccount();
            setConfirmOpen(false);
            if (r.success) {
              await cortexDeskApiClient.auth.logout();
              window.location.href = '/login';
            }
          }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
