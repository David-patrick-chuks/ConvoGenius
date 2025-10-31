"use client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AgentIdHeader } from "../components/agent-id-view-header";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useState } from "react";
import { UpdateAgentDialog } from "../components/update-agent-dialog";

interface Props{
    agentId: string;
}

export const AgentIdView = ({agentId}:Props) => {
    const router = useRouter();
    const [UpdateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const {data} = useSuspenseQuery(trpc.agents.getOne.queryOptions({id: agentId}));
    const removeAgent = useMutation(
        trpc.agents.remove.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({}));
                await queryClient.invalidateQueries(
                    trpc.premium.getFreeUsage.queryOptions(),
                );
                router.push("/agents");
            },
            onError: (error) => {
                toast.error(error.message );
            }
        })
    );
    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        `The following action will remove the agent ${data.name} and all its associated data. This action cannot be undone.`
    );
    const handleRemoveAgent = async () => {
        const ok = await confirmRemove();
        if (!ok) return;

        await removeAgent.mutateAsync({id: agentId});
    }

    return(
        <>
            <RemoveConfirmation/>
            <UpdateAgentDialog
                open={UpdateAgentDialogOpen}
                onOpenChange={setUpdateAgentDialogOpen}
                initialValues={data}
            />
            <div className="flex-1 py-1 px-4 md:px-8 flex flex-col gap-y-4">
                <AgentIdHeader 
                    agentName={data.name}
                    agentId={agentId}
                    onEdit={() => setUpdateAgentDialogOpen(true)}
                    onRemove={handleRemoveAgent}
                />
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                        <div className="flex items-center gap-x-3">
                            <GeneratedAvatar
                                variant="botttsNeutral"
                                seed = {data.name}
                                className="size-10"
                            />
                            <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
                                {data.name}
                            </h2>
                        </div>
                        <Badge
                            variant = "outline"
                            className="flex items-center gap-x-2 [&>svg]:size-4 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        >
                            <VideoIcon className="text-blue-700 dark:text-blue-400"/>
                            {data.meetingCount}{data.meetingCount === 1 ? " meeting" : " meetings"}
                        </Badge>
                        <div className="flex flex-col gap-y-4">
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Instructions
                            </p>
                            <p className="text-gray-800 dark:text-gray-300">
                                {data.instructions}
                            </p>
                        </div>
                    </div>
                </div>
            </div> 
        </>
    )
}

export const AgentIdLoading = () => {
    return (
        <LoadingState
            title="Loading agent..."
            description="Please wait while we load your agents."/>
    );
}

export const AgentIdError = () => {
    return (
        <ErrorState
            title="Error loading agent"
            description="There was an error loading your agents. Please try again later."
        />
    );
}