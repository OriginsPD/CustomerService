/**
 * useQueueStream — subscribes to the server's SSE queue stream and
 * invalidates the TanStack Query queue cache on every "queue-update" event.
 *
 * Designed to be used alongside useQueue: useQueue handles data fetching
 * while this hook handles real-time push updates. Together they replace
 * the previous 15-second polling interval.
 */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";

export function useQueueStream() {
  const queryClient = useQueryClient();
  const retryDelay = useRef(1_000);
  const esRef = useRef<EventSource | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const es = new EventSource("/api/queue/stream");
      esRef.current = es;

      es.addEventListener("queue-update", () => {
        setIsOffline(false);
        retryDelay.current = 1_000; // reset backoff on successful message
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() });
      });

      es.addEventListener("ping", () => {
        setIsOffline(false);
      });

      es.addEventListener("error", () => {
        setIsOffline(true);
        es.close();
        if (!destroyed) {
          const delay = Math.min(retryDelay.current, 30_000);
          retryDelay.current = delay * 2;
          setTimeout(connect, delay);
        }
      });
    }

    connect();

    return () => {
      destroyed = true;
      esRef.current?.close();
    };
  }, [queryClient]);

  return { isOffline };
}
