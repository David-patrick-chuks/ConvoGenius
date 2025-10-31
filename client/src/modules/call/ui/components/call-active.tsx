import { CallControls, SpeakerLayout, useCallStateHooks, LoadingIndicator } from "@stream-io/video-react-sdk";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props{
    onLeave : () => void;   
    meetingName: string;
}

export const CallActive = ({ onLeave, meetingName }: Props) => {
    const { useParticipants, useCallCallingState, useIsCallLive } = useCallStateHooks();
    const participants = useParticipants();
    const callingState = useCallCallingState();
    const isCallLive = useIsCallLive();
    const [isStabilized, setIsStabilized] = useState(false);

    // More comprehensive state checking
    const isCallReady = callingState === 'joined' && 
                       isCallLive && 
                       participants.length > 0 && 
                       participants.some(p => p.sessionId && p.userId);

    // Add a small delay to ensure participant state is stabilized
    useEffect(() => {
        if (isCallReady) {
            const timer = setTimeout(() => {
                setIsStabilized(true);
            }, 500); // 500ms delay
            
            return () => clearTimeout(timer);
        } else {
            setIsStabilized(false);
        }
    }, [isCallReady]);

    return (
        <div className="flex flex-col justify-between p-4 h-screen text-white">
            {/* Header */}
            <div className="bg-slate-900 rounded-full p-3 flex items-center gap-4 mb-2">
                <Link href="/" className="flex items-center justify-center p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-full">
                    <Image src="/logo.svg" width={22} height={22} alt="logo" className="min-w-[22px]" />
                </Link>
                <h4 className="text-base truncate">{meetingName}</h4>
            </div>
            
            {/* Main content - video container */}
            <div className="flex-1 min-h-0 relative overflow-hidden rounded-xl mb-2">
                {isCallReady && isStabilized ? (
                    <SpeakerLayout />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <LoadingIndicator />
                    </div>
                )}
            </div>
            
            {/* Footer controls */}
            <div className="bg-slate-900 rounded-full px-4 py-2">
                <CallControls onLeave={onLeave} />
            </div>
        </div>
    );
}