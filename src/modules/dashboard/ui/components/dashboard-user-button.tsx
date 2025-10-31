import { authClient } from "@/lib/auth-client";
import{
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuContent, 
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export const DashboardUserButton = () => {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const {data, isPending} = authClient.useSession()
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const onLogout =  () => {
         authClient.signOut({
            fetchOptions:{
                onSuccess: () => {
                    router.push("/")
                }
            }
        })
    }

    

    if (isPending || !data?.user || !mounted){
        return null;
    }
    
    return(
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
                {data.user.image ? (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={data.user.image} alt={data.user.name || "User"} />
                        <AvatarFallback>{data.user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                ): (
                    <GeneratedAvatar
                    seed = {data.user.name}
                    variant="initials"
                    className="size-9 mr-3"
                    />
                )}
                <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
                    <p className="text-sm truncate w-full">
                        {data.user.name}
                    </p>
                    <p className="text-xs truncate w-full">
                        {data.user.email}
                    </p>
                </div>
                <ChevronDownIcon className="size-4 shrink-0"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-72 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DropdownMenuLabel className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                    <span className="font-medium truncate">{data.user.name} </span>
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 truncate">{data.user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700"/>
                <DropdownMenuItem onClick={() => authClient.customer.portal()} className="cursor-pointer flex items-center justify-between text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Billing
                    <CreditCardIcon className="size-4"/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer flex items-center justify-between text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" >
                    LogOut
                    <LogOutIcon className="size-4" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};