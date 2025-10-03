"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { getWebSocketService, WebSocketEvent } from "../../services/websocket-service";

/**
 * SIMPLIFIED Global WebSocket Notification Listener
 *
 * Alur:
 * 1. User login → WebSocket connect
 * 2. Submit assessment → job queued
 * 3. Worker starts → event: analysis-started
 * 4. Worker done → event: analysis-complete / analysis-failed
 */
export default function NotificationRedirectListener() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run when user is authenticated
    if (!user) {
      console.log("⏸️ [NotificationRedirect] No user, skipping setup");
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) {
      console.log("⏸️ [NotificationRedirect] No token, skipping setup");
      return;
    }

    console.log("🔌 [NotificationRedirect] Setting up WebSocket for user:", user.id);

    const wsService = getWebSocketService();

    // Check current connection status
    const status = wsService.getStatus();
    console.log("📊 [NotificationRedirect] Current WebSocket status:", status);

    // Event handler - handles all notification events
    const handleEvent = (event: WebSocketEvent) => {
      console.log("📨 [NotificationRedirect] Event received:", event.type, event);

      // 1. Analysis Started
      if (event.type === 'analysis-started') {
        const name = event.assessment_name || event.metadata?.assessmentName || "Assessment";
        console.log("📊 [NotificationRedirect] Analysis started:", name);
        toast.info("Analysis Started", {
          description: `Processing ${name}...`,
          duration: 3000
        });
      }

      // 2. Analysis Complete - CRITICAL FOR AUTO-REDIRECT
      if (event.type === 'analysis-complete') {
        const resultId = event.result_id || event.resultId;
        const assessmentName = event.assessment_name || event.metadata?.assessmentName || "Assessment";

        console.log("🎉 [NotificationRedirect] Analysis complete! Result ID:", resultId);

        if (!resultId) {
          console.warn("⚠️ [NotificationRedirect] No result_id in event!");
          return;
        }

        // Prevent duplicate redirects
        if (lastRedirectRef.current === resultId) {
          console.log("ℹ️ [NotificationRedirect] Already redirected to this result");
          return;
        }

        // Don't redirect if already on result page
        if (window.location.pathname === `/results/${resultId}`) {
          console.log("ℹ️ [NotificationRedirect] Already on result page");
          return;
        }

        lastRedirectRef.current = resultId;

        // Invalidate SWR cache for dashboard auto-update
        if (user?.id) {
          console.log("🔄 [NotificationRedirect] Invalidating cache for user:", user.id);
          mutate((key) => typeof key === 'string' && key.includes(`user-stats-${user.id}`));
          mutate((key) => typeof key === 'string' && key.includes(`assessment-history-${user.id}`));
          mutate((key) => typeof key === 'string' && key.includes(`latest-result-${user.id}`));
        }

        // Show toast and redirect
        toast.success("Analysis Complete!", {
          description: `${assessmentName} ready! Opening results...`,
          duration: 3000
        });

        console.log(`🔀 [NotificationRedirect] Redirecting to /results/${resultId} in 500ms`);
        setTimeout(() => {
          console.log(`🔀 [NotificationRedirect] Executing redirect now!`);
          router.push(`/results/${resultId}`);
        }, 500);
      }

      // 3. Analysis Failed
      if (event.type === 'analysis-failed') {
        console.error("❌ [NotificationRedirect] Analysis failed:", event.error);
        toast.error("Analysis Failed", {
          description: event.error || "Please try again",
          duration: 5000
        });
      }
    };

    // CRITICAL: Register listener BEFORE connecting to avoid race condition
    console.log("📝 [NotificationRedirect] Registering event listener...");
    const removeListener = wsService.addEventListener(handleEvent);
    console.log("✅ [NotificationRedirect] Event listener registered");

    // Connect to WebSocket - SIMPLIFIED
    console.log("🔌 [NotificationRedirect] Connecting...");
    wsService.connect(token)
      .then(() => {
        const newStatus = wsService.getStatus();
        console.log("✅ [NotificationRedirect] Connected:", newStatus);

        // Show toast only for new connections
        if (!status.isConnected) {
          toast.success("Notifications ready", { duration: 2000 });
        }
      })
      .catch((error) => {
        console.error("❌ [NotificationRedirect] Failed:", error);

        // Check if server is unavailable
        const isServerDown = error.message?.includes('Server unavailable') ||
                             error.message?.includes('Backend') ||
                             error.message?.includes('running');

        if (isServerDown) {
          console.warn("🚫 [NotificationRedirect] Backend server offline");
          toast.warning("Backend server offline", {
            description: "Real-time notifications disabled. Start the backend server.",
            duration: 8000
          });
          return;
        }

        // Show generic error for other failures
        if (!error.message?.includes('timeout')) {
          toast.error("Notifications unavailable", {
            description: "You may not receive real-time updates",
            duration: 3000
          });
        }
      });

    // Cleanup on unmount or user change
    return () => {
      console.log("🧹 [NotificationRedirect] Cleaning up listener (NOT disconnecting - shared connection)");
      removeListener();
    };
  }, [user]); // Only re-run when user changes (login/logout)

  return null;
}
