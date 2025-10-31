import { CircleCheckIcon, CircleXIcon, ClockArrowUpIcon, LoaderIcon, VideoIcon } from "lucide-react";
import { MeetingStatus } from "../../types";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { CommandSelect } from "@/components/command-select";

const options = [
    {
        id: MeetingStatus.Upcoming,
        value: MeetingStatus.Upcoming,
        children: (
            <div className="flex items-center gap-x-2 capitalize text-gray-900 dark:text-gray-100">
                <ClockArrowUpIcon className="text-gray-600 dark:text-gray-400" />
                {MeetingStatus.Upcoming}
            </div>
        )
    },
    {
        id: MeetingStatus.Completed,
        value: MeetingStatus.Completed,
        children: (
            <div className="flex items-center gap-x-2 capitalize text-gray-900 dark:text-gray-100">
                <CircleCheckIcon className="text-gray-600 dark:text-gray-400" />
                {MeetingStatus.Completed}
            </div>
        )
    },
    {
        id: MeetingStatus.Active,
        value: MeetingStatus.Active,
        children: (
            <div className="flex items-center gap-x-2 capitalize text-gray-900 dark:text-gray-100">
                <VideoIcon className="text-gray-600 dark:text-gray-400" />
                {MeetingStatus.Active}
            </div>
        )
    },
    {
        id: MeetingStatus.Processing,
        value: MeetingStatus.Processing,
        children: (
            <div className="flex items-center gap-x-2 capitalize text-gray-900 dark:text-gray-100">
                <LoaderIcon className="text-gray-600 dark:text-gray-400" />
                {MeetingStatus.Processing}
            </div>
        )
    },
    {
        id: MeetingStatus.Cancelled,
        value: MeetingStatus.Cancelled,
        children: (
            <div className="flex items-center gap-x-2 capitalize text-gray-900 dark:text-gray-100">
                <CircleXIcon className="text-gray-600 dark:text-gray-400" />
                {MeetingStatus.Cancelled}
            </div>
        )
    },
    
];

export const StatusFilters = () => {
    const [filters, setFilters] = useMeetingsFilters();
    return(
        <CommandSelect 
            placeholder="Status"
            className="h-9"
            options={options}
            onSelect={(value) => setFilters({ status: value as MeetingStatus})}
            value = {filters.status ?? ""}
        />
    )
}