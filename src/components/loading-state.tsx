import { Loader2Icon } from "lucide-react";
interface Props{
    title: string;
    description: string;   
}

export const LoadingState = ({ title, description }: Props) => {
    return(
        <div className="py-4 px-8 flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-y-6 bg-background dark:bg-gray-800 rounded-lg p-10 shadow-md border border-gray-200 dark:border-gray-700">
                <Loader2Icon className="size-6 animate-spin text-primary dark:text-blue-400"/>
                <div className="flex flex-col gap-y-2 text-center">
                    <h6 className="text-lg font-medium text-gray-900 dark:text-gray-100"> {title} </h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400"> {description} </p>
                </div>
            </div>
        </div>   
    )
        
}