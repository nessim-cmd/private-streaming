"use client";

import React from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { LiveChatPanel } from "@/components/LiveRoom/LiveChatPanel";

interface VideoConferenceProps {
  token: string;
  isHost: boolean;
}

export function VideoConference({ token, isHost }: VideoConferenceProps) {
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
        <VideoLayout />
        <ControlBar variation="minimal" />
      </section>

      <LiveChatPanel />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function VideoLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks} className="flex-1">
      <ParticipantTile />
    </GridLayout>
  );
}
