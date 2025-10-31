import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { BanIcon, VideoIcon } from "lucide-react"
import Link from "next/link"

interface Props {
    meetingId: string;
    onCancelMeeting: () => void;
    isCancelling: boolean;
}

export const UpcomingState = ({
    meetingId,
    onCancelMeeting,
    isCancelling
}: Props) => {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
                image="/upcoming.svg"
                title="No Upcoming Meetings"
                description="Once you create a meeting, a summary will appear here."
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2">
                <Button
                    variant="secondary"
                    className="w-full lg:w-auto bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                    onClick={onCancelMeeting}
                    disabled={isCancelling}
                >
                    <BanIcon className="size-4" />
                    Cancel Meeting
                </Button>
                <Button 
                    asChild 
                    disabled={isCancelling} 
                    className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Link href={`/call/${meetingId}`}>
                        <VideoIcon className="size-4" />
                        Start Meeting
                    </Link>
                </Button>
            </div>
        </div>
    )
} 