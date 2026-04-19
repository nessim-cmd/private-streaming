"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "../../../components/ui/Button";
import { StreamEnded } from "../../../components/LiveRoom/StreamEnded";
import { VideoConference } from "../../../components/LiveRoom/VideoConference";
import { RoomSharePanel } from "../../../components/LiveRoom/RoomSharePanel";
import { RoomMessageHistory } from "../../../components/LiveRoom/RoomMessageHistory";
import { Bell, CheckCircle2, ChevronLeft, Loader2, Users, Video, XCircle, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "../../../lib/i18n";

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
  const { t } = useTranslation();
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
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs animate-pulse">
          {t('loading')}
        </p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="h-24 w-24 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
          <XCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">Room Not Found</h1>
          <p className="text-zinc-400 max-w-md mx-auto font-medium">
            The room you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard")} variant="outline" className="h-12 px-8 rounded-xl font-bold">
          {t('back_to_dashboard')}
        </Button>
      </div>
    );
  }

  if (room.isActive === false && !isHost) {
    return <StreamEnded />;
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl px-4 sm:px-8 h-16 shrink-0">
        <div className="container mx-auto h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExit}
              disabled={endingRoom}
              className="flex gap-2 h-9 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">{endingRoom ? t('loading') : t('back_to_dashboard')}</span>
            </Button>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-lg font-black text-white flex items-center gap-2 truncate">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${room.isActive ? 'bg-emerald-500' : 'bg-red-500'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${room.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                {room.name}
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                {isHost ? "Host" : "Participant"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-zinc-900/50 px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-zinc-400 border border-white/5 shadow-inner">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>0 {t('participants')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
        <div className="container mx-auto flex-1 flex flex-col max-w-6xl p-4 sm:p-8">
          {isHost && room && room.isActive === false && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 mb-8"
            >
              <div className="glass-card rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Video className="h-32 w-32" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 italic">Stream Ended</h2>
                <p className="text-zinc-400 font-medium max-w-lg leading-relaxed">
                  You can reopen it to go live again, or review all past messages below.
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Button onClick={reopenRoom} disabled={reopening} className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 btn-hover-effect">
                    {reopening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {reopening ? t('loading') : "Reopen Room"}
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-12 px-8 rounded-xl font-bold border-white/10 glass">
                    {t('back_to_dashboard')}
                  </Button>
                </div>
              </div>

              <RoomMessageHistory roomId={room.id} />
            </motion.div>
          )}

          {isHost && token && joinRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 text-amber-400 text-sm font-black uppercase tracking-widest mb-4">
                <Bell className="h-5 w-5 animate-bounce" />
                {joinRequests.length} {t('invite_others')}
              </div>
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between bg-zinc-950/50 rounded-xl px-4 py-3 border border-white/5">
                    <div className="text-sm text-zinc-200 font-medium font-mono">{request.email}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestDecision(request.id, "approve")}
                        disabled={actingRequestId === request.id}
                        className="h-9 px-4 rounded-lg font-bold"
                      >
                        {actingRequestId === request.id && actingRequestAction === "approve" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestDecision(request.id, "reject")}
                        disabled={actingRequestId === request.id}
                        className="h-9 px-4 rounded-lg font-bold border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        {actingRequestId === request.id && actingRequestAction === "reject" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Reject"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {hostNotice && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 font-bold text-center shadow-lg"
            >
              {hostNotice}
            </motion.div>
          )}

          {isHost && room && (
            <div className="mb-8">
              <div className="md:hidden">
                <details className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-white flex items-center justify-between uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {t('share_room')}
                    </span>
                    <span className="text-zinc-500 text-[10px]">QR, Link, Email</span>
                  </summary>
                  <div className="px-4 pb-4">
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center py-12"
            >
              <div className="glass-card p-8 sm:p-16 rounded-[3rem] max-w-xl w-full text-center space-y-8 sm:space-y-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10" />
                
                <div className="h-24 w-24 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-2xl group-hover:scale-110 transition-transform">
                  <Video className="h-12 w-12" />
                </div>

                {isHost ? (
                  <>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-black text-white leading-tight italic">Ready to go live?</h2>
                      <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                        Connect your camera and microphone to start your secure stream.
                      </p>
                    </div>
                    <Button 
                      onClick={joinRoom} 
                      disabled={joining} 
                      className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/30 btn-hover-effect"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          {t('loading')}
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
                        <div className="space-y-3">
                          <h2 className="text-3xl font-black text-white leading-tight">{t('login')}</h2>
                          <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                            Please sign in so the host can see your identity and approve your access.
                          </p>
                        </div>
                        <div className="grid gap-3">
                          <Button asChild className="w-full h-14 rounded-2xl font-black text-lg">
                            <Link href={`/sign-in?redirect_url=/room/${id}`}>{t('login')}</Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-black text-lg border-white/10 glass">
                            <Link href={`/sign-up?redirect_url=/room/${id}`}>{t('signup')}</Link>
                          </Button>
                        </div>
                      </>
                    )}

                    {accessStatus === "not-requested" && (
                      <>
                        <div className="space-y-3">
                          <h2 className="text-3xl font-black text-white leading-tight italic">Request to join</h2>
                          <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                            Ask the host for approval before entering this private room.
                          </p>
                        </div>
                        <Button onClick={requestAccess} disabled={requestingAccess} className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/30 btn-hover-effect">
                          {requestingAccess ? (
                            <>
                              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                              {t('loading')}
                            </>
                          ) : (
                            "Request Access"
                          )}
                        </Button>
                      </>
                    )}

                    {accessStatus === "pending" && (
                      <>
                        <div className="space-y-4">
                          <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">Waiting for Approval</h2>
                            <p className="text-zinc-400 font-medium leading-relaxed">
                              Your request is pending. This page joins automatically once approved.
                            </p>
                          </div>
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
                          className="w-full h-14 rounded-2xl font-black border-white/10 glass"
                        >
                          Refresh Status
                        </Button>
                      </>
                    )}

                    {accessStatus === "rejected" && (
                      <>
                        <div className="space-y-4">
                          <div className="mx-auto h-20 w-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                            <XCircle className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white leading-tight">Request Rejected</h2>
                            <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                              You do not have permission to enter this room.
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full h-14 rounded-2xl font-black border-white/10 glass">
                          {t('back_to_dashboard')}
                        </Button>
                      </>
                    )}

                    {accessStatus === "approved" && (
                      <>
                        <div className="space-y-4">
                          <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <ShieldCheck className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white leading-tight italic">Approved</h2>
                            <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                              Your request was accepted. You can join the stream now.
                            </p>
                          </div>
                        </div>
                        <Button onClick={joinRoom} disabled={joining} className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/30 btn-hover-effect">
                          {joining ? (
                            <>
                              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                              {t('loading')}
                            </>
                          ) : (
                            "Join Stream"
                          )}
                        </Button>
                      </>
                    )}

                    {accessStatus === "unknown" && (
                      <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">{t('loading')}</div>
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

