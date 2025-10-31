import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState, useRef, useEffect } from "react";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";
import { gsap } from "gsap";

interface Props{
    meetingName: string;
}

export const CallUI = ({  meetingName }: Props) => {
    const call = useCall();
    const [show, setShow] = useState<"lobby" | "call" | "ended" >("lobby");
    const containerRef = useRef<HTMLDivElement>(null);

    const handleJoin = async () => {
        if (!call) return;

        try {
            // Animate transition to call
            if (containerRef.current) {
                gsap.to(containerRef.current, {
                    scale: 0.95,
                    opacity: 0.8,
                    duration: 0.3,
                    ease: "power2.inOut",
                    onComplete: () => {
                        (async () => {
                            try {
                                await call.join();
                                setShow("call");
                                gsap.to(containerRef.current, {
                                    scale: 1,
                                    opacity: 1,
                                    duration: 0.5,
                                    ease: "back.out(1.7)"
                                });
                            } catch (error) {
                                console.error("Failed to join call:", error);
                                // Reset animation on error
                                gsap.set(containerRef.current, { scale: 1, opacity: 1 });
                            }
                        })();
                    }
                });
            } else {
                await call.join();
                setShow("call");
            }
        } catch (error) {
            console.error("Failed to join call:", error);
        }
    }

    const handleLeave = () => {
        if (!call) return;

        // Animate transition to ended
        if (containerRef.current) {
            gsap.to(containerRef.current, {
                rotationY: 180,
                opacity: 0.5,
                duration: 0.4,
                ease: "power2.inOut",
                onComplete: () => {
                    call.leave();
                    setShow("ended");
                    gsap.fromTo(containerRef.current, {
                        rotationY: -180,
                        opacity: 0
                    }, {
                        rotationY: 0,
                        opacity: 1,
                        duration: 0.6,
                        ease: "back.out(1.7)"
                    });
                }
            });
        } else {
            call.leave();
            setShow("ended");
        }
    }

    useEffect(() => {
        // Initial entrance animation
        if (containerRef.current) {
            gsap.fromTo(containerRef.current, {
                opacity: 0,
                scale: 0.8,
                y: 50
            }, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        }
    }, []);

    return(
        <div ref={containerRef}>
            <StreamTheme>
                {show === "lobby" && <CallLobby onJoin={handleJoin} />}
                {show === "call" && <CallActive onLeave={handleLeave} meetingName={meetingName}/>}
                {show === "ended" && <CallEnded/>}
            </StreamTheme>
        </div>
    )

}