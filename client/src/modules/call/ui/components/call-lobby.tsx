import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import { DefaultVideoPlaceholder, StreamVideoParticipant, useCallStateHooks, VideoPreview,ToggleAudioPreviewButton, ToggleVideoPreviewButton } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { LogInIcon } from "lucide-react";
import Link from "next/link";


interface Props {
    onJoin: () => void;
}

const DisabledVideoPreview = () =>{
    const {data} =authClient.useSession();

    return (
        <DefaultVideoPlaceholder
            participant={
                {
                    name: data?.user.name ?? "",
                    image: 
                        data?.user.image ??
                        generateAvatarUri({
                            seed: data?.user.id ?? "",
                            variant: "initials",
                        })
                } as StreamVideoParticipant
            }
        />
    )
}

const AllowBrowserPermissions = () => {
    return(
        <p className="text-sm">
            Please allow browser permissions for camera and microphone to join the call.
        </p>
    )
}


export const CallLobby = ({ onJoin }: Props) => {
    const {useCameraState, useMicrophoneState} = useCallStateHooks();

    const {hasBrowserPermission: hasMicPermission} = useMicrophoneState();
    const {hasBrowserPermission: hasCameraPermission} = useCameraState();

    const hasBrowserPermission = hasMicPermission && hasCameraPermission;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-radial from-slate-800 to-slate-950 dark:from-gray-900 dark:to-gray-950">
            <div className="py-4 px-8 flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-y-6 bg-background dark:bg-gray-800 rounded-lg p-8 sm:p-10 shadow-md max-w-md w-full border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-y-2 text-center">
                        <h6 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready to Join?</h6>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Set up your call before joining</p>
                    </div>
                    <VideoPreview
                        DisabledVideoPreview={
                            hasBrowserPermission 
                                ? DisabledVideoPreview
                                : AllowBrowserPermissions
                        }
                    />
                    <div className="flex gap-x-3">
                        <ToggleAudioPreviewButton />
                        <ToggleVideoPreviewButton />
                    </div>
                    <div className="flex gap-x-3 justify-between w-full mt-2">
                        <Button asChild variant="ghost" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Link href="/meetings">
                                Cancel
                            </Link>
                        </Button>
                        <Button
                            onClick={onJoin}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <LogInIcon className="mr-2 size-4" />
                            Join Call
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}