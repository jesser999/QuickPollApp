import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { store, Poll } from './store';
import { randomUUID } from 'crypto';

// Parse FRONTEND_URL as a comma-separated list so multiple origins are
// supported without code changes (e.g. on Railway with custom domains).
const allowedOrigins: string | string[] = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const resolvedOrigins = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins;

console.log('Allowed CORS origins:', resolvedOrigins);

const app = express();
app.use(cors({ origin: resolvedOrigins, credentials: true }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: resolvedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('QuickPoll API is running');
});

app.post('/api/polls', async (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      res.status(400).json({ error: 'Invalid poll data. Need question and at least 2 options.' });
      return;
    }

    const newPoll: Poll = {
      id: randomUUID(),
      question,
      options: options.map((opt: string) => ({ id: randomUUID(), text: opt, votes: 0 })),
      createdAt: Date.now()
    };

    await store.savePoll(newPoll);
    res.status(201).json(newPoll);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_poll', async (pollId: string) => {
    socket.join(pollId);
    const poll = await store.getPoll(pollId);
    if (poll) {
      socket.emit('poll_data', poll);
    } else {
      socket.emit('poll_error', { message: 'Poll not found' });
    }
  });

  socket.on('vote', async ({ pollId, optionId }) => {
    const updatedPoll = await store.vote(pollId, optionId);
    if (updatedPoll) {
      io.to(pollId).emit('poll_data', updatedPoll);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

async function start() {
  await store.connect();
  httpServer.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

start();
