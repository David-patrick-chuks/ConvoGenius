"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { useState } from "react";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { StatusFilters } from "./status-filters";
import { AgentIdFilter } from "./agent-id-filter";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


export const MeetingsListHeader = () => {
  const [filters, setFilters] = useMeetingsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isAnyFilterModified =
    !!filters.status || !! filters.search || !! filters.agentId;
  
  const onClearFilters = () => {
    setFilters({
      status: null,
      agentId: null,
      search: "",
      page: 1,
    })
  }
  return (
    <>
      <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        <div className="py-4 px-4 md:px-8 flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
                  <h5 className="font-medium text-xl text-gray-900 dark:text-gray-100">My Meetings</h5>
                  <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <PlusIcon/>
                      New Meetings
                  </Button>
          </div>
          <ScrollArea> 
            <div className="flex items-center gap-x-2 p-1  ">
              <MeetingsSearchFilter />
              <StatusFilters />
              <AgentIdFilter />
              {isAnyFilterModified && (
                <Button variant="outline" onClick={onClearFilters} className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <XCircleIcon className="size-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">Clear Filters</span>
                </Button>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
    </>
  );
};