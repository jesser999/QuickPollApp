import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Guard against misconfigured env vars (e.g. NEXT_PUBLIC_BACKEND_URL accidentally
// set to a Redis connection string on Railway or similar platforms).
if (!BACKEND_URL.startsWith('http://') && !BACKEND_URL.startsWith('https://')) {
  throw new Error(
    `[QuickPoll] NEXT_PUBLIC_BACKEND_URL is misconfigured: "${BACKEND_URL}"\n` +
    `It must be an HTTP/HTTPS URL pointing to the backend service.\n` +
    `Check your environment variables and redeploy the frontend.`
  );
}

export const socket: Socket = io(BACKEND_URL, {
  autoConnect: false,
});

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: number;
}
