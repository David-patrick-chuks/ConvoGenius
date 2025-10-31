import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronsRightIcon, TrashIcon, PencilIcon, MoreVerticalIcon } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    } from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

interface Props{
    meetingId: string;
    meetingName: string;
    onEdit: () => void;
    onRemove: () => void;
}

export const MeetingIdViewHeader = ({
    meetingId, 
    meetingName, 
    onEdit, 
    onRemove}: Props) => {
    return (
        <div className="flex items-center justify-between">
            <Breadcrumb >
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-md text-xl text-gray-900 dark:text-gray-100">
                            <Link href="/meetings">
                                My Meetings
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-foreground dark:text-gray-300 text-xl font-medium [$>svg]:size-4" >
                        <ChevronsRightIcon />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-md text-xl text-foreground dark:text-gray-200">
                            <Link href={`/meetings/${meetingId}`}>
                                {meetingName}
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>  
            </Breadcrumb>
            <DropdownMenu modal = {false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <MoreVerticalIcon className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align = "end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem onClick={onEdit} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <PencilIcon className="size-4 text-black dark:text-gray-100" />
                            Edit Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRemove} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <TrashIcon className="size-4 text-red-500 dark:text-red-400" />
                            Delete Meeting
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>      
        </div>
    );
};