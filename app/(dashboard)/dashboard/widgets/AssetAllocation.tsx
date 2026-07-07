"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AllocationChart = dynamic(
  () => import("../Charts").then((module) => ({ default: module.AllocationChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />,
  }
);

interface AssetAllocationProps {
  allocationData: { name: string; value: number; target: number }[];
  totalInvestable: number;
}

export function AssetAllocation({ allocationData, totalInvestable }: AssetAllocationProps) {
  if (allocationData.length === 0) return null;

  return <AllocationChart allocationData={allocationData} totalInvestable={totalInvestable} />;
}
