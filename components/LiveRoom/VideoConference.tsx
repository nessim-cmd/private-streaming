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
import { LiveChatPanel } from "@/components/LiveRoom/LiveChatPanel";

interface VideoConferenceProps {
  token: string;
  isHost: boolean;
  hostIdentity?: string;
}

export function VideoConference({ token, isHost, hostIdentity }: VideoConferenceProps) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  return (
    <LiveKitRoom
      video={isHost}
      audio={isHost}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
      className="flex-1 flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-border bg-black/40 gap-3 p-3"
    >
      <section className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-black/35">
        <FocusedVideoLayout hostIdentity={hostIdentity} />
        <ControlBar variation="minimal" />
      </section>

      <LiveChatPanel />
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
    <div className="flex-1 min-h-0 flex gap-3 p-3">
      <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/40 min-h-0">
        {mainTrack ? (
          <ParticipantTile trackRef={mainTrack} className="h-full w-full" />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-zinc-400">
            Waiting for camera...
          </div>
        )}
      </div>

      <aside className="w-44 xl:w-52 shrink-0 rounded-2xl border border-white/10 bg-black/35 p-2 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 px-1">Participants</div>
        <div className="space-y-2">
          {sideTracks.length === 0 ? (
            <div className="text-xs text-zinc-500 px-1 py-2">No one else yet.</div>
          ) : (
            sideTracks.map((track) => (
              <div
                key={`${track.participant.identity}-${track.source}`}
                className="rounded-xl overflow-hidden border border-white/10 bg-black/40 h-28"
              >
                <ParticipantTile trackRef={track} className="h-full w-full" />
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
