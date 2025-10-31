import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { VideoIcon } from "lucide-react"
import Link from "next/link"

interface Props {
    meetingId: string;

}

export const ActiveState = ({
    meetingId,

}: Props) => {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
                image="/upcoming.svg"
                title="Meeting is Active"
                description="Meeting will end once all participants leave."
            />
            <div className="flex flex-col-reverse lg:flex-col lg:justify-center items-center gap-2">
                <Button asChild className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href={`/call/${meetingId}`} >
                        <VideoIcon />
                        Join Meeting
                    </Link>
                </Button>
            </div>
        </div>
    )
}
    