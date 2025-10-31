"use client";
import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BotIcon, StarIcon, VideoIcon, LayoutDashboardIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardUserButton } from "./dashboard-user-button-client";
import { DashboardTrial } from "./dashboard-trial";


const firstSection = [
    {
        icon: LayoutDashboardIcon,
        label: "Dashboard",
        href: "/dashboard"
    },
    {
        icon: VideoIcon,
        label: "Meetings",
        href: "/meetings"
    },
    {
        icon: BotIcon,
        label: "Agents",
        href: "/agents"
        
    }
]
const secondSection = [
    {
        icon: StarIcon,
        label: "Upgrade",
        href: "/upgrade"
    }
]

export const DashboardSidebar = () => {
    const pathname = usePathname();


    return ( 
        <Sidebar>
            <SidebarHeader className="text-sidebar-accent-foreground dark:text-gray-200">
                <Link href= "/dashboard" className="flex items-center gap-2 px-2 pt-2">
                <Image src="/logo.svg" height = {36} width={36} alt="Meet AI" />
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">ConvoGenius</p>
                </Link>
            </SidebarHeader>
            <div className="px-4 py-2">
                 <Separator className="opacity-10 text-[#5D6B68] dark:text-gray-600" />
            </div>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {firstSection.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild className={cn(
                                        "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 dark:hover:border-gray-600/20 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50 text-gray-900 dark:text-gray-100",
                                        pathname === item.href && "bg-linear-to/oklch border-[#5D6B68]/10 dark:border-gray-600/20"
                                    )}
                                    isActive = {pathname === item.href}
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="w-4 h-4" />
                                            <span className="text-sm font-medium tracking-tight">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <div className="px-4 py-2">
                 <Separator className="opacity-10 text-[#5D6B68] dark:text-gray-600" />
                </div>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {secondSection.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild className={cn(
                                        "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 dark:hover:border-gray-600/20 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50 text-gray-900 dark:text-gray-100",
                                        pathname === item.href && "bg-linear-to/oklch border-[#5D6B68]/10 dark:border-gray-600/20"
                                    )}
                                    isActive = {pathname === item.href}
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="w-4 h-4" />
                                            <span className="text-sm font-medium tracking-tight">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="text-white dark:text-gray-200">
                <DashboardTrial/>
                <DashboardUserButton/>            
            </SidebarFooter>
        </Sidebar>
     );
}
 
