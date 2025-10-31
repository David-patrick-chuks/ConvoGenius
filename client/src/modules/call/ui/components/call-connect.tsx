import { useTRPC } from '@/trpc/client';
import {
    Call,
    CallingState,
    StreamCall,
    StreamVideo,
    StreamVideoClient
} from '@stream-io/video-react-sdk';

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useMutation } from '@tanstack/react-query';
import { LoaderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CallUI } from './call-ui';

interface Props{
    meetingId: string;
    meetingName: string;
    userId: string;
    userName: string;
    userImage: string;
}

export const CallConnect = ({ meetingId, meetingName, userId, userName, userImage }: Props) => {
    const trpc = useTRPC();
    const {mutateAsync: generateToken} = useMutation(
        trpc.meetings.generateToken.mutationOptions(),
    )

    const [client, setClient] = useState<StreamVideoClient>();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(()=>{
        let _client: StreamVideoClient;
        
        const initializeClient = async () => {
            try {
                setError(null);
                
                // Generate the token first
                const token = await generateToken();
                
                // Create the client with the token directly
                _client = new StreamVideoClient({
                    apiKey: process.env.NEXT_PUBLIC_SECRET_STREAM_VIDEO_API_KEY!,
                    user: {
                        id: userId,
                        name: userName,
                        image: userImage
                    },
                    token: token,
                    options: {
                        timeout: 10000,
                    },
                });

                // Explicitly connect the user
                await _client.connectUser(
                    {
                        id: userId,
                        name: userName,
                        image: userImage
                    },
                    token
                );
                
                setClient(_client);
                setIsConnected(true);
            } catch (error) {
                console.error('Failed to initialize Stream client:', error);
                setError(error instanceof Error ? error.message : 'Failed to connect');
            }
        };

        initializeClient();

        return () => {
            if (_client) {
                _client.disconnectUser();
            }
            setClient(undefined);
            setIsConnected(false);
            setError(null);
        }
    }, [userId, userName, userImage, generateToken]);

    const [call, setCall] = useState<Call>();
    useEffect(() => {
        if (!client || !isConnected) return;

        const _call = client.call("default", meetingId)
        _call.camera.disable();
        _call.microphone.disable();
        setCall(_call);

        return () =>{
            if(_call.state.callingState !== CallingState.LEFT) {
                _call.leave();
                setCall(undefined);
            }
        }
    },[client, meetingId, isConnected])

    if(error) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent-to-sidebar">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Failed to connect to call</p>
                    <p className="text-white/70 text-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if(!client || !call || !isConnected) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent-to-sidebar">
                <div className="text-center">
                    <LoaderIcon className="size-6 animate-spin text-white mb-2" />
                    <p className="text-white/70">Connecting to call...</p>
                </div>
            </div>
        );
    }



    return (
        <StreamVideo client={client}>
            <StreamCall call={call} >
                <CallUI meetingName={meetingName} />
            </StreamCall>
        </StreamVideo>
    );
}