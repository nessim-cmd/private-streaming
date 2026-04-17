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
import { LiveOverlayFeed } from "@/components/LiveRoom/LiveOverlayFeed";

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
      className="flex-1 rounded-2xl overflow-hidden border border-border bg-black/40 flex flex-col"
    >
      <section className="relative flex-1 min-h-[60vh] bg-black">
        <FocusedVideoLayout hostIdentity={hostIdentity} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/35" />
        <LiveOverlayFeed roomId={roomId} />
      </section>

      <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-3 py-2">
        <ControlBar variation="minimal" />
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
        <ParticipantTile trackRef={mainTrack} className="h-full w-full" />
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-zinc-400">
          Waiting for camera...
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
