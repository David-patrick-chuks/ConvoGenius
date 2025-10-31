"use client";

import dynamic from 'next/dynamic';

const DynamicDashboardUserButton = dynamic(
  () => import('./dashboard-user-button').then(mod => ({ default: mod.DashboardUserButton })),
  {
    ssr: false,
    loading: () => null
  }
);

export { DynamicDashboardUserButton as DashboardUserButton };
