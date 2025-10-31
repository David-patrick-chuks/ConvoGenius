import { LandingView } from "@/modules/landing/ui/views/landing-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <LandingView />;
};

export default Page;
