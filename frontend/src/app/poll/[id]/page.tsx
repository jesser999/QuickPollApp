"use client";

import { useEffect, useState, use } from "react";
import { socket, Poll } from "@/lib/socket";
import { Copy, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const pollId = unwrappedParams.id;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has already voted
    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    if (votedPolls.includes(pollId)) {
      setHasVoted(true);
    }

    // Connect and join poll room
    socket.connect();
    socket.emit("join_poll", pollId);

    // Listeners
    const onPollData = (data: Poll) => {
      setPoll(data);
      setError("");
    };

    const onPollError = (err: { message: string }) => {
      setError(err.message);
    };

    socket.on("poll_data", onPollData);
    socket.on("poll_error", onPollError);

    return () => {
      socket.off("poll_data", onPollData);
      socket.off("poll_error", onPollError);
      // We don't necessarily disconnect the socket here as they might navigate around
    };
  }, [pollId]);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    socket.emit("vote", { pollId, optionId });
    setHasVoted(true);
    
    // Save to local storage
    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    localStorage.setItem("votedPolls", JSON.stringify([...votedPolls, pollId]));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <main className="container">
        <div className="glass-panel" style={{ marginTop: "4rem", textAlign: "center" }}>
          <h1 className="title" style={{ fontSize: "2rem" }}>Oops!</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!poll) {
    return (
      <main className="container" style={{ display: "flex", justifyContent: "center", marginTop: "10rem" }}>
        <div className="loader"></div>
      </main>
    );
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <main className="container">
      <div className="glass-panel" style={{ marginTop: "4rem" }}>
        <h1 className="title" style={{ fontSize: "2rem", marginBottom: "1rem" }}>{poll.question}</h1>
        
        <p style={{ color: "#94a3b8", marginBottom: "2rem", textAlign: "center" }}>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} cast
        </p>

        <div className="options-container">
          {poll.options.map((opt) => {
            const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
            
            return (
              <div
                key={opt.id}
                className={`poll-option-card ${hasVoted ? "voted" : ""}`}
                onClick={() => handleVote(opt.id)}
                style={{ cursor: hasVoted ? "default" : "pointer" }}
              >
                {hasVoted && (
                  <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                )}
                <div className="poll-content">
                  <span className="poll-text">{opt.text}</span>
                  {hasVoted && (
                    <span className="poll-votes">
                      {percentage}% ({opt.votes})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasVoted && (
          <div style={{ marginTop: "2rem", textAlign: "center", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={20} />
            <span>Your vote has been recorded!</span>
          </div>
        )}

        <div className="share-box">
          <span className="share-url">Share: {typeof window !== 'undefined' ? window.location.href : ''}</span>
          <button 
            className="btn btn-secondary" 
            style={{ padding: "0.5rem 1rem", width: "auto" }}
            onClick={handleCopyLink}
          >
            {copied ? "Copied!" : <><Copy size={16} /> Copy</>}
          </button>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Plus size={20} /> Create New Poll
          </Link>
        </div>
      </div>
    </main>
  );
}
