"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import {  useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { DataPagination } from "@/components/data-pagination";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const MeetingsView = () => {
    const trpc = useTRPC();
    const router = useRouter();
    const [filters, setFilters] = useMeetingsFilters();
    const containerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);
    const {data} = useSuspenseQuery(trpc.meetings.getMany.queryOptions({
        ...filters,
    }))

    useEffect(() => {
        if (typeof window !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            // Animate container entrance
            if (containerRef.current) {
                gsap.fromTo(containerRef.current, 
                    {
                        opacity: 0,
                        y: 50,
                        scale: 0.95
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.8,
                        ease: "power3.out"
                    }
                );
            }

            // Animate table with stagger effect
            if (tableRef.current) {
                const rows = tableRef.current.querySelectorAll('tr');
                if (rows.length > 0) {
                    gsap.fromTo(rows,
                        {
                            opacity: 0,
                            x: -30,
                            rotationY: -15
                        },
                        {
                            opacity: 1,
                            x: 0,
                            rotationY: 0,
                            duration: 0.6,
                            stagger: 0.1,
                            ease: "power2.out",
                            delay: 0.3
                        }
                    );
                }
            }

            // Animate pagination
            if (paginationRef.current) {
                gsap.fromTo(paginationRef.current,
                    {
                        opacity: 0,
                        y: 20
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: "power2.out",
                        delay: 0.6
                    }
                );
            }
        }
    }, [data.items]);

    return ( 
        <div ref={containerRef} className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4"> 
            <div ref={tableRef}>
                <DataTable data={data.items} columns ={columns} onRowClick={(row) => router.push(`/meetings/${row.id}`) } />
            </div>
            <div ref={paginationRef}>
                <DataPagination
                    page = {filters.page}   
                    totalPages={data.totalPages}
                    onPageChange={(page) => setFilters({page})}
                />
            </div>
            {data.items.length === 0 && (
                <EmptyState
                    title = "Create your first Meeting"
                    description="Create a meeting to start collaborating with your agents. Meetings can be scheduled with different participants and can have different settings."
                />
            )}
        </div>
     );
}

export const MeetingsViewLoading = () => {
    return (
        <LoadingState
            title="Loading Meetings..."
            description="Please wait while we load your meetings."/>
    );
}

export const MeetingsViewError = () => {
    return (
        <ErrorState
            title="Error loading meetings"
            description="There was an error loading your meetings. Please try again later."
        />
    );
}