import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Page() {
  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="border rounded-md">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/20">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Table rows */}
        {Array(5)
          .fill(null)
          .map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 p-4 border-b">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full max-w-[200px]" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export default Page;
