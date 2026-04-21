# Quick Poll Application

A containerized, real-time polling application built with modern web technologies. Create polls instantly, share dynamic links, and watch the votes roll in live!

## Tech Stack

This project was built with performance, scalability, and developer experience in mind:

- **Frontend:** Next.js (App Router), React, TypeScript, Socket.io-client
- **Backend:** Node.js, Express.js, TypeScript, Socket.io
- **Database / Cache:** Redis (for fast, persistent, in-memory poll storage)
- **Containerization:** Docker & Docker Compose (Multi-stage builds)
- **Styling:** Vanilla CSS (Modern glassmorphism UI)

## Key Features

- **Real-Time Interactivity:** Leveraging Socket.io, votes are broadcasted instantaneously to all connected clients viewing a poll.
- **Dynamic Routing:** Next.js generates shareable, unique URLs for every poll created.
- **Anonymous Voting:** Uses local storage to ensure users can only vote once per poll, without the friction of a full authentication system.
- **Production-Ready Docker Setup:** 
  - Independent containers for Frontend, Backend, and Redis.
  - Multi-stage Dockerfiles reduce the final image size by discarding build dependencies.
  - Proper service-to-service internal networking (avoiding `localhost` inside containers).
- **Scalable Architecture:** Incorporating Redis allows the Node.js backend to easily scale horizontally in the future using Redis Pub/Sub for WebSockets.
- **Performance Optimizations:** Uses Next.js standalone output to keep the frontend container lightweight and fast.

## How to Run

You only need Docker and Docker Compose installed on your machine.

1. Clone the repository and navigate into the project directory.
2. Run the following command to build and start the application:

```bash
docker-compose up --build
```

3. Open your browser:
   - Frontend UI: http://localhost:3000
   - Backend API/Sockets: http://localhost:3001

## Folder Structure

```text
/
├── docker-compose.yml     # Orchestrates Redis, Frontend, and Backend
├── frontend/              # Next.js App Router project
│   ├── Dockerfile         # Multi-stage build for frontend
│   └── src/app/           # UI, dynamic routes, and global styles
└── backend/               # Express + Socket.io project
    ├── Dockerfile         # Multi-stage build for backend
    └── src/               # Express server and Redis store logic
```

## Professional Git History

This repository features a clean, professional commit history following the Conventional Commits standard to demonstrate an organized development lifecycle.