import { EmptyState } from "@/components/empty-state"


export const ProcessingState = () => {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
                image="/processing.svg"
                title="This meeting is being processed"
                description="The meeting is currently being processed and will be available shortly."
            />
        </div>
    )
}
    