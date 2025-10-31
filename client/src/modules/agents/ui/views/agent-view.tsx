"use client";

import {  useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client"; 
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useAgentFilters } from "../../hooks/use-agent-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { DataTable } from "@/components/data-table";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const AgentView = () => {
    const router = useRouter();
    const [filters, setFilters] = useAgentFilters();
    const trpc = useTRPC();
    const containerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);
       
    const {data} =useSuspenseQuery(trpc.agents.getMany.queryOptions({
        ...filters,
    }));

    useEffect(() => {
        if (typeof window !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            // Animate container with cool 3D entrance
            if (containerRef.current) {
                gsap.fromTo(containerRef.current, 
                    {
                        opacity: 0,
                        y: 60,
                        rotationX: 30,
                        scale: 0.9,
                        transformPerspective: 1000
                    },
                    {
                        opacity: 1,
                        y: 0,
                        rotationX: 0,
                        scale: 1,
                        duration: 1,
                        ease: "power3.out"
                    }
                );
            }

            // Animate table rows with magnetic effect
            if (tableRef.current) {
                const rows = tableRef.current.querySelectorAll('tr');
                if (rows.length > 0) {
                    gsap.fromTo(rows,
                        {
                            opacity: 0,
                            x: -50,
                            rotationY: -20,
                            scale: 0.95
                        },
                        {
                            opacity: 1,
                            x: 0,
                            rotationY: 0,
                            scale: 1,
                            duration: 0.7,
                            stagger: 0.15,
                            ease: "back.out(1.7)",
                            delay: 0.4
                        }
                    );

                    // Add hover animations to rows
                    rows.forEach((row) => {
                        row.addEventListener('mouseenter', () => {
                            gsap.to(row, {
                                scale: 1.02,
                                z: 10,
                                boxShadow: "0 10px 25px rgba(34, 197, 94, 0.2)",
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        });

                        row.addEventListener('mouseleave', () => {
                            gsap.to(row, {
                                scale: 1,
                                z: 0,
                                boxShadow: "0 0 0 rgba(34, 197, 94, 0)",
                                duration: 0.4,
                                ease: "power2.out"
                            });
                        });
                    });
                }
            }

            // Animate pagination with bounce
            if (paginationRef.current) {
                gsap.fromTo(paginationRef.current,
                    {
                        opacity: 0,
                        y: 30,
                        scale: 0.8
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        ease: "elastic.out(1, 0.75)",
                        delay: 0.8
                    }
                );
            }
        }
    }, [data.items]);

    return (
        <div ref={containerRef} className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
            <div ref={tableRef}>
                <DataTable data = {data.items} columns = {columns} onRowClick={(row) => router.push(`/agents/${row.id}`)} />
            </div>
            <div ref={paginationRef}>
                <DataPagination
                    page = {filters.page}
                    totalPages = {data.totalPages}
                    onPageChange = {(page) => setFilters({ page })}  
                />
            </div>
            {data.items.length === 0 && (
                <EmptyState
                    title = "Create your first agent"
                    description="Create an agent to join your meetings. Each agent can have its own instructions and can interact with different participants in the meeting."
                />
            )}
        </div>
    )
}
export const AgentsViewLoading = () => {
    return (
        <LoadingState 
            title="Loading agents..."
            description="Please wait while we load your agents."/>
    );
}

export const AgentsViewError = () => {
    return (
        <ErrorState
            title="Error loading agents"
            description="There was an error loading your agents. Please try again later."
        />
    );
}