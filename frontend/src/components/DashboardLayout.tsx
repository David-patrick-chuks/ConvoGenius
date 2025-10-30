"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { HealthApiClient } from "@/utils/api/healthApi";
import {
    Bell,
    Bot,
    FolderOpen,
    Home,
    LogOut,
    Plus,
    Rocket,
    Search,
    Settings,
    User
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cortexDeskApiClient } from "@/utils/api";
import { useRouter } from "next/navigation";

interface SidebarProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Resources", href: "/dashboard/resources", icon: FolderOpen },
  { name: "Deployments", href: "/dashboard/deployments", icon: Rocket },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await cortexDeskApiClient.auth.logout();
      router.push('/login');
    } catch (_) {
      router.push('/login');
    }
  };

  useEffect(() => {
    (async () => {
      const res = await HealthApiClient.getHealthStatus();
      setHealthy(res.success);
    })();
  }, []);

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
    {/* Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-slate-400/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 backdrop-blur-2xl bg-white/5 border-r border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">CortexDesk</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-white border border-white/20 shadow"
                      : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-white/5">
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">John Doe</p>
                    <p className="text-xs text-gray-400">john@example.com</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-[#0b1120]/95 text-gray-100 border border-white/10">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="backdrop-blur-2xl bg-white/5 border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </Button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search agents, resources..."
                  className="pl-10 w-72 rounded-xl bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {healthy !== null && (
                <div className={`w-2.5 h-2.5 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-red-500'}`} title={healthy ? 'Backend: OK' : 'Backend: Down'} />
              )}
              <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/10">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-blue-600 text-white">3</Badge>
              </Button>
              
              <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-create-agent'));
                }
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
