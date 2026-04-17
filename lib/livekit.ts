import 'server-only';

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function requireAnyEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  throw new Error(`${names.join(' or ')} is not configured.`);
}

function toHttpLiveKitUrl(url: string): string {
  if (url.startsWith('wss://')) {
    return `https://${url.slice('wss://'.length)}`;
  }

  if (url.startsWith('ws://')) {
    return `http://${url.slice('ws://'.length)}`;
  }

  return url;
}

export async function generateToken(
  roomName: string,
  identity: string,
  isHost: boolean
): Promise<string> {
  const apiKey = requireEnv('LIVEKIT_API_KEY');
  const apiSecret = requireEnv('LIVEKIT_API_SECRET');

  const accessToken = new AccessToken(apiKey, apiSecret, { identity });

  accessToken.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isHost,
    canSubscribe: true,
  });

  return accessToken.toJwt();
}

export function getRoomServiceClient(): RoomServiceClient {
  const apiKey = requireEnv('LIVEKIT_API_KEY');
  const apiSecret = requireEnv('LIVEKIT_API_SECRET');
  const liveKitUrl = requireAnyEnv(['LIVEKIT_URL', 'NEXT_PUBLIC_LIVEKIT_URL']);

  return new RoomServiceClient(toHttpLiveKitUrl(liveKitUrl), apiKey, apiSecret);
}
