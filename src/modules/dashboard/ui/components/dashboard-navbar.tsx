"use client";

import { Button } from "@/components/ui/button";
import { PanelLeftCloseIcon, PanelLeftIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export const DashboardNavbar = () => {
    const { state, toggleSidebar, isMobile } = useSidebar();  

    return (
        <nav className=" flex px-4 gap-x-2 items-center py-3 border-b bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Button className="size-9 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700" variant="outline" onClick={toggleSidebar}>
                { (state === "collapsed" || isMobile) ? 
                <PanelLeftIcon className="size-4"/> : 
                <PanelLeftCloseIcon className="size-4"/> 
                }
            </Button>
        </nav> 
    );
};
