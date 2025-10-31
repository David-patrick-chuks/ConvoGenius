import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  UpgradeView,
  UpgradeViewError,
  UpgradeViewLoading,
  } from "@/modules/premium/ui/views/upgrade-view";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

const Page = () => {
  return(
    <Suspense fallback={<UpgradeViewLoading />}>
      <ErrorBoundary fallback={<UpgradeViewError />}>
        <UpgradeView  />
      </ErrorBoundary>
    </Suspense>
  );
}

export default Page;