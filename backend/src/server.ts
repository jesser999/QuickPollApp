import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { store, Poll } from './store';
import { randomUUID } from 'crypto';

const app = express();

// Manual CORS middleware — works with Express 5 and any origin.
// Mirrors the request origin back so credentials are supported.
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('QuickPoll API is running');
});

app.post('/api/polls', async (req: Request, res: Response) => {
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
    console.error('Error creating poll:', error);
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

// Global error handler to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await store.connect();
    httpServer.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

