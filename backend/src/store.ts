import { createClient } from 'redis';

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

export class PollStore {
  private redisClient;
  private isRedisReady = false;
  private memoryStore: Map<string, Poll> = new Map();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = createClient({ url: redisUrl });

    this.redisClient.on('error', (err) => {
      console.warn('Redis error, falling back to memory store:', err);
      this.isRedisReady = false;
    });

    this.redisClient.on('ready', () => {
      console.log('Redis connected successfully.');
      this.isRedisReady = true;
    });
  }

  async connect() {
    try {
      await this.redisClient.connect();
    } catch (err) {
      console.warn('Could not connect to Redis. Running with in-memory store.');
    }
  }

  async getPoll(id: string): Promise<Poll | null> {
    if (this.isRedisReady) {
      const data = await this.redisClient.get(`poll:${id}`);
      return data ? JSON.parse(data) : null;
    }
    return this.memoryStore.get(id) || null;
  }

  async savePoll(poll: Poll): Promise<void> {
    if (this.isRedisReady) {
      await this.redisClient.set(`poll:${poll.id}`, JSON.stringify(poll), {
        EX: 60 * 60 * 24 // Expire after 24 hours
      });
    } else {
      this.memoryStore.set(poll.id, poll);
    }
  }

  async vote(pollId: string, optionId: string): Promise<Poll | null> {
    let poll = await this.getPoll(pollId);
    if (!poll) return null;

    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    if (optionIndex > -1) {
      poll.options[optionIndex].votes += 1;
      await this.savePoll(poll);
    }
    
    return poll;
  }
}

export const store = new PollStore();
