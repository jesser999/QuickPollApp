import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { store, Poll } from './store';
import { randomUUID } from 'crypto';

// Allow all origins dynamically (mirrors request origin back).
// This supports credentials and works across Railway deployments
// without needing to hardcode or configure FRONTEND_URL.
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

console.log('CORS: allowing all origins with credential support');

const app = express();
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
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
