"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";

function getPageNumbers(totalPages: number, currentPageZeroBased: number): (number | "ellipsis")[] {
  const current = currentPageZeroBased + 1;
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, current]);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: TablePaginationProps) {
  const pageNumbers = getPageNumbers(totalPages, currentPage);

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="text-sm text-[#6b6a6e]">
        Página {currentPage + 1} de {totalPages}
      </div>
      <nav role="navigation" aria-label="Paginación" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || disabled}
          aria-label="Página anterior"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((item, i) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-[#6b6a6e]" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={currentPage === item - 1 ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(item - 1)}
                disabled={disabled}
                aria-label={`Página ${item}`}
                aria-current={currentPage === item - 1 ? "page" : undefined}
                className="h-8 min-w-8 p-0"
              >
                {item}
              </Button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || disabled}
          aria-label="Página siguiente"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}

export { TablePagination };
