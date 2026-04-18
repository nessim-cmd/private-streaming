"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { StreamEnded } from "@/components/LiveRoom/StreamEnded";
import { VideoConference } from "@/components/LiveRoom/VideoConference";
import { RoomSharePanel } from "@/components/LiveRoom/RoomSharePanel";
import { RoomMessageHistory } from "@/components/LiveRoom/RoomMessageHistory";
import { Bell, CheckCircle2, ChevronLeft, Loader2, Users, Video, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Room {
  id: string;
  name: string;
  isActive: boolean;
  hostIdentity?: string;
}

interface JoinRequest {
  id: string;
  email: string;
  createdAt: string;
}

type AccessStatus = "unknown" | "signin-required" | "not-requested" | "pending" | "approved" | "rejected";

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();

  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [endingRoom, setEndingRoom] = useState(false);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("unknown");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingRequestAction, setActingRequestAction] = useState<"approve" | "reject" | null>(null);
  const [hostNotice, setHostNotice] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetch(`/api/rooms/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRoom(data.room);
        setIsHost(data.isHost);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !room || isHost) {
      return;
    }

    if (!isUserLoaded) {
      return;
    }

    if (!isSignedIn) {
      setAccessStatus("signin-required");
      return;
    }

    const loadMyStatus = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}/join-requests/me`);
        const data = await response.json();
        if (typeof data.status === "string") {
          setAccessStatus(data.status as AccessStatus);
        }
      } catch (error) {
        console.error("Failed to load join status:", error);
      }
    };

    loadMyStatus();
  }, [id, isHost, isSignedIn, isUserLoaded, loading, room]);

  useEffect(() => {
    if (isHost || !room?.isActive || token || accessStatus !== "pending") {
      return;
    }

    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}/join-requests/me`);
        const data = await response.json();
        if (typeof data.status === "string") {
          setAccessStatus(data.status as AccessStatus);
        }
      } catch (error) {
        console.error("Failed to refresh join status:", error);
      }
    };

    const interval = window.setInterval(refreshStatus, 3000);
    return () => window.clearInterval(interval);
  }, [accessStatus, id, isHost, room?.isActive, token]);

  useEffect(() => {
    if (!isHost || !token || !room?.isActive) {
      return;
    }

    let previousCount = 0;

    const loadRequests = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}/join-requests`);
        const data = await response.json();
        const requests = Array.isArray(data.requests) ? (data.requests as JoinRequest[]) : [];
        setJoinRequests(requests);

        if (previousCount > 0 && requests.length > previousCount) {
          setHostNotice("New participant is waiting for approval.");
          window.setTimeout(() => setHostNotice(""), 2500);
        }

        previousCount = requests.length;
      } catch (error) {
        console.error("Failed to load join requests:", error);
      }
    };

    loadRequests();
    const interval = window.setInterval(loadRequests, 4000);

    return () => window.clearInterval(interval);
  }, [id, isHost, token, room?.isActive]);

  useEffect(() => {
    if (!isHost || !token || !room?.isActive) {
      return;
    }

    const endRoomOnUnload = () => {
      fetch(`/api/rooms/${id}/end`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        // Intentionally ignored because the page is unloading.
      });
    };

    window.addEventListener("beforeunload", endRoomOnUnload);

    return () => {
      window.removeEventListener("beforeunload", endRoomOnUnload);
    };
  }, [id, isHost, room?.isActive, token]);

  const endRoom = async () => {
    if (!isHost || !room?.isActive) {
      return;
    }

    setEndingRoom(true);
    try {
      await fetch(`/api/rooms/${id}/end`, { method: "POST" });
      setRoom((previous) => (previous ? { ...previous, isActive: false } : previous));
    } catch (error) {
      console.error("Failed to end room:", error);
    } finally {
      setEndingRoom(false);
    }
  };

  const handleExit = async () => {
    if (isHost && room?.isActive) {
      await endRoom();
    }

    router.push("/dashboard");
  };

  const requestAccess = async () => {
    setRequestingAccess(true);
    try {
      const response = await fetch(`/api/rooms/${id}/join-requests`, { method: "POST" });
      const data = await response.json();
      if (data.status === "approved") {
        setAccessStatus("approved");
      } else {
        setAccessStatus("pending");
      }
    } catch (error) {
      console.error("Failed to request access:", error);
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleRequestDecision = async (requestId: string, action: "approve" | "reject") => {
    setActingRequestId(requestId);
    setActingRequestAction(action);

    try {
      await fetch(`/api/rooms/${id}/join-requests/${requestId}/${action}`, { method: "POST" });
      setJoinRequests((previous) => previous.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
    } finally {
      setActingRequestId(null);
      setActingRequestAction(null);
    }
  };

  const joinRoom = useCallback(async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, isHost }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
      } else if (data.code === "REQUEST_REJECTED") {
        setAccessStatus("rejected");
      } else if (data.code === "APPROVAL_REQUIRED") {
        setAccessStatus("pending");
      }
    } catch (error) {
      console.error("Failed to join room:", error);
    } finally {
      setJoining(false);
    }
  }, [id, isHost]);

  useEffect(() => {
    if (isHost || accessStatus !== "approved" || joining || token || !room?.isActive) {
      return;
    }

    void joinRoom();
  }, [accessStatus, isHost, joining, joinRoom, room?.isActive, token]);

  const reopenRoom = async () => {
    if (!isHost || !room || room.isActive) {
      return;
    }

    setReopening(true);
    try {
      const response = await fetch(`/api/rooms/${id}/reopen`, { method: "POST" });
      if (response.ok) {
        setRoom((previous) => (previous ? { ...previous, isActive: true, endedAt: null } : previous));
      }
    } catch (error) {
      console.error("Failed to reopen room:", error);
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Entering the room...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <Users className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold">Room Not Found</h1>
        <p className="text-muted-foreground max-w-md text-center">
          The room you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (room.isActive === false && !isHost) {
    return <StreamEnded />;
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border bg-background/50 backdrop-blur-sm px-3 sm:px-8 py-3 sm:py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExit}
              disabled={endingRoom}
              className="flex gap-2 px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{endingRoom ? "Ending..." : "Exit"}</span>
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {room.name}
              </h1>
              <p className="text-xs text-muted-foreground">{isHost ? "Hosted by you" : "Awaiting host approval"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium border border-border">
              <Users className="h-3 w-3" />
              <span>0 Participants</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-3 sm:p-8">
        <div className="container mx-auto flex-1 flex flex-col max-w-6xl">
          {isHost && room && room.isActive === false && (
            <div className="space-y-4 mb-4">
              <div className="glass rounded-2xl border border-white/10 p-4 sm:p-6">
                <h2 className="text-xl font-bold text-white">This room is currently ended</h2>
                <p className="text-zinc-300 mt-2">
                  You can reopen it to go live again, or review all past messages below.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={reopenRoom} disabled={reopening} className="gap-2">
                    {reopening ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {reopening ? "Reopening..." : "Reopen Room"}
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
                </div>
              </div>

              <RoomMessageHistory roomId={room.id} />
            </div>
          )}

          {isHost && token && joinRequests.length > 0 && (
            <div className="mb-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3">
              <div className="flex items-center gap-2 text-amber-200 text-sm font-medium">
                <Bell className="h-4 w-4" />
                {joinRequests.length} request{joinRequests.length > 1 ? "s" : ""} waiting for approval
              </div>
              <div className="mt-2 space-y-2">
                {joinRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between bg-black/25 rounded-lg px-3 py-2">
                    <div className="text-sm text-zinc-200">{request.email}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestDecision(request.id, "approve")}
                        disabled={actingRequestId === request.id}
                        className="h-8 px-3"
                      >
                        {actingRequestId === request.id && actingRequestAction === "approve" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestDecision(request.id, "reject")}
                        disabled={actingRequestId === request.id}
                        className="h-8 px-3 border-red-400/40 text-red-200 hover:bg-red-500/10"
                      >
                        {actingRequestId === request.id && actingRequestAction === "reject" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Reject"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hostNotice && (
            <div className="mb-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              {hostNotice}
            </div>
          )}

          {isHost && room && (
            <div className="mb-4">
              <div className="md:hidden">
                <details className="glass rounded-2xl border border-white/10 overflow-hidden">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white flex items-center justify-between">
                    Share room
                    <span className="text-zinc-400 text-xs">QR, link, email</span>
                  </summary>
                  <div className="px-3 pb-3">
                    <RoomSharePanel roomId={room.id} roomName={room.name} />
                  </div>
                </details>
              </div>
              <div className="hidden md:block">
                <RoomSharePanel roomId={room.id} roomName={room.name} />
              </div>
            </div>
          )}

          {!token && room.isActive ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="glass p-6 sm:p-12 rounded-3xl max-w-md w-full text-center space-y-6 sm:space-y-8">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Video className="h-10 w-10" />
                </div>

                {isHost ? (
                  <>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white">Ready to go live?</h2>
                      <p className="text-muted-foreground">
                        Connect your camera and microphone to start streaming.
                      </p>
                    </div>
                    <Button 
                      onClick={joinRoom} 
                      disabled={joining} 
                      className="w-full h-12 text-lg font-semibold"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Join Stream"
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {accessStatus === "signin-required" && (
                      <>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white">Sign in required</h2>
                          <p className="text-muted-foreground">
                            Please sign in so the host can see your identity and approve your access.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Button asChild className="w-full h-11">
                            <Link href={`/sign-in?redirect_url=/room/${id}`}>Sign In</Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full h-11">
                            <Link href={`/sign-up?redirect_url=/room/${id}`}>Sign Up</Link>
                          </Button>
                        </div>
                      </>
                    )}

                    {accessStatus === "not-requested" && (
                      <>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white">Request to join</h2>
                          <p className="text-muted-foreground">
                            Ask the host for approval before entering this live room.
                          </p>
                        </div>
                        <Button onClick={requestAccess} disabled={requestingAccess} className="w-full h-12 text-lg font-semibold">
                          {requestingAccess ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Sending request...
                            </>
                          ) : (
                            "Request Access"
                          )}
                        </Button>
                      </>
                    )}

                    {accessStatus === "pending" && (
                      <>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white">Waiting for host approval</h2>
                          <p className="text-muted-foreground">
                            Your request is pending. This page auto-refreshes and will join automatically once approved.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const response = await fetch(`/api/rooms/${id}/join-requests/me`);
                            const data = await response.json();
                            if (typeof data.status === "string") {
                              setAccessStatus(data.status as AccessStatus);
                            }
                          }}
                          className="w-full h-11"
                        >
                          Refresh Status
                        </Button>
                      </>
                    )}

                    {accessStatus === "rejected" && (
                      <>
                        <div className="space-y-2">
                          <div className="mx-auto h-10 w-10 rounded-full bg-red-500/15 text-red-300 flex items-center justify-center">
                            <XCircle className="h-5 w-5" />
                          </div>
                          <h2 className="text-2xl font-bold text-white">Request rejected</h2>
                          <p className="text-muted-foreground">
                            You are rejected to enter this room.
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full h-11">
                          Return to Dashboard
                        </Button>
                      </>
                    )}

                    {accessStatus === "approved" && (
                      <>
                        <div className="space-y-2">
                          <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <h2 className="text-2xl font-bold text-white">Approved</h2>
                          <p className="text-muted-foreground">
                            You can now join this live room.
                          </p>
                        </div>
                        <Button onClick={joinRoom} disabled={joining} className="w-full h-12 text-lg font-semibold">
                          {joining ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            "Join Stream"
                          )}
                        </Button>
                      </>
                    )}

                    {accessStatus === "unknown" && (
                      <div className="text-sm text-muted-foreground">Checking access...</div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ) : room.isActive ? (
            <VideoConference 
              token={token} 
              isHost={isHost} 
              hostIdentity={room.hostIdentity}
              roomId={room.id}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
