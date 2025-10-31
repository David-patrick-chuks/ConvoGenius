import { auth } from "@/lib/auth";
import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  
  // Prefetch dashboard data
  void queryClient.prefetchQuery(
    trpc.meetings.getMany.queryOptions({
      page: 1,
      pageSize: 5,
    })
  );
  
  void queryClient.prefetchQuery(
    trpc.agents.getMany.queryOptions({
      page: 1,
      pageSize: 5,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
};

export default Page;
