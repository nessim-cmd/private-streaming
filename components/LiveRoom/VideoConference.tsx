"use client";

import React from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { LiveOverlayFeed } from "./LiveOverlayFeed";

interface VideoConferenceProps {
  token: string;
  isHost: boolean;
  hostIdentity?: string;
  roomId: string;
}

export function VideoConference({ token, isHost, hostIdentity, roomId }: VideoConferenceProps) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  return (
    <LiveKitRoom
      video={isHost}
      audio={isHost}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
      className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-950 flex flex-col shadow-2xl relative"
    >
      <section className="relative flex-1 min-h-[60vh] bg-black">
        <FocusedVideoLayout hostIdentity={hostIdentity} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/40 pointer-events-none" />
        <LiveOverlayFeed roomId={roomId} />
      </section>

      <div className="border-t border-white/5 bg-zinc-900/80 backdrop-blur-2xl px-4 py-4 sm:px-8">
        <ControlBar variation="minimal" className="!bg-transparent !border-0" />
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function FocusedVideoLayout({ hostIdentity }: { hostIdentity?: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  const mainTrack = React.useMemo(() => {
    const hostTrack = hostIdentity
      ? tracks.find((track) => track.participant.identity === hostIdentity)
      : undefined;

    return hostTrack ?? tracks[0];
  }, [hostIdentity, tracks]);

  const sideTracks = React.useMemo(() => {
    return tracks.filter((track) => {
      if (!mainTrack) {
        return true;
      }

      return !(
        track.participant.identity === mainTrack.participant.identity &&
        track.source === mainTrack.source
      );
    });
  }, [mainTrack, tracks]);

  return (
    <div className="h-full w-full">
      {mainTrack ? (
        <ParticipantTile trackRef={mainTrack} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-600 bg-zinc-900/50">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-zinc-800 animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest italic">Initializing Camera...</p>
        </div>
      )}

      <div className="hidden">
        {sideTracks.map((track) => (
          <span key={`${track.participant.identity}-${track.source}`} />
        ))}
      </div>
    </div>
  );
}

