"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getWebSocketService, isWebSocketSupported } from "../../services/notificationService";
import apiService from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Global listener that redirects to the result page when an analysis-complete
 * notification arrives from the notification service / WebSocket.
 *
 * Mounted once in RootLayout so the redirect works from anywhere in the app.
 */
export default function NotificationRedirectListener() {
  const router = useRouter();
  const { user } = useAuth();
  const wsInitialized = useRef(false);
  const redirectGuardRef = useRef(false);

  useEffect(() => {
    if (!user || wsInitialized.current || !isWebSocketSupported()) return;

    const ws = getWebSocketService();
    wsInitialized.current = true;

    const token =
      (typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("auth_token"))) || "";
    if (!token) return;

    let unsubscribe: (() => void) | null = null;

    ws.connect(token)
      .then(() => {
        unsubscribe = ws.addEventListener(async (event: any) => {
          // React only to completion events
          if (event?.type === "analysis-complete" || event?.status === "completed") {
            if (redirectGuardRef.current) return;
            redirectGuardRef.current = true;

            // Grace period to allow backend to persist the result
            await new Promise((res) => setTimeout(res, 10000));

            let resultId: string | undefined = event?.resultId;

            // Fallback: fetch resultId from status API using jobId if not present
            if (!resultId && event?.jobId) {
              for (let attempt = 0; attempt < 5 && !resultId; attempt++) {
                try {
                  // @ts-ignore JS service typing
                  const status = await apiService.getAssessmentStatus(event.jobId);
                  if (status?.success && status.data?.resultId) {
                    resultId = status.data.resultId as string;
                    break;
                  }
                } catch (_e) {
                  // ignore and retry
                }
                // Backoff: 1.5s, 3s, 4.5s, 6s, 7.5s
                await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
              }
            }

            if (resultId) {
              router.replace(`/results/${resultId}`);
            } else {
              // Release guard so future events can retry
              redirectGuardRef.current = false;
            }
          }
        });
      })
      .catch(() => {
        // silent
      });

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {}
      }
    };
  }, [user, router]);

  return null;
}

