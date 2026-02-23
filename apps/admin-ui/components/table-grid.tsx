"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getLiveMatches, getMatchAssignments } from "@/lib/api";
import type { Match, MatchAssignment } from "@/lib/types";
import { TableCard } from "./table-card";
import { MatchDetailModal } from "./match-detail-modal";

interface TableGridProps {
  tableNumbers: number[];
  columns?: 1 | 3;
}

export function TableGrid({ tableNumbers, columns = 3 }: TableGridProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [assignments, setAssignments] = useState<MatchAssignment[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<Match | null>(null);
  const modalOpen = useRef(false);

  const fetchData = useCallback(() => {
    Promise.all([getLiveMatches(), getMatchAssignments()])
      .then(([mRes, aRes]) => {
        setMatches(mRes.data);
        setAssignments(aRes.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!modalOpen.current) fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExpand = useCallback((match: Match) => {
    setExpandedMatch(match);
    modalOpen.current = true;
  }, []);

  const handleClose = useCallback(() => {
    setExpandedMatch(null);
    modalOpen.current = false;
  }, []);

  if (tableNumbers.length === 0) return null;

  return (
    <>
      <div className={`grid gap-4 ${columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {tableNumbers.map((tableNum) => {
          const match = matches.find((m) => m.tableNumber === tableNum);
          const assignment = assignments.find(
            (a) =>
              a.tableNumber === tableNum &&
              (a.status === "PENDING" || a.status === "CLAIMED")
          );
          return (
            <TableCard
              key={tableNum}
              tableNumber={tableNum}
              match={match}
              assignment={assignment}
              onExpand={handleExpand}
            />
          );
        })}
      </div>
      <MatchDetailModal match={expandedMatch} onClose={handleClose} />
    </>
  );
}
