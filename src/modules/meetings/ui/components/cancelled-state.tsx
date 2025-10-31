import { EmptyState } from "@/components/empty-state"


export const CancelledState = () => {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
                image="/cancelled.svg"
                title="This meeting was cancelled"
                description="The meeting has been cancelled and will not take place."
            />
        </div>
    )
}
    