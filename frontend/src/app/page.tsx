"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Send } from "lucide-react";

export default function CreatePoll() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      setError("Please provide at least 2 options.");
      return;
    }

    setIsLoading(true);

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND_URL}/api/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options: validOptions }),
      });

      if (!res.ok) {
        throw new Error("Failed to create poll");
      }

      const poll = await res.json();
      router.push(`/poll/${poll.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="glass-panel" style={{ marginTop: "4rem" }}>
        <h1 className="title">Quick Poll</h1>
        <p className="subtitle">Create a real-time poll instantly. No sign-up required.</p>

        {error && (
          <div style={{ color: "#ef4444", marginBottom: "1rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Your Question</label>
            <input
              type="text"
              className="input"
              placeholder="What's on your mind?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Options</label>
            {options.map((opt, index) => (
              <div key={index} className="option-row">
                <input
                  type="text"
                  className="input"
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveOption(index)}
                    aria-label="Remove option"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddOption}
              style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
            >
              <Plus size={16} /> Add Another Option
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? <div className="loader"></div> : <><Send size={20} /> Create Poll</>}
          </button>
        </form>
      </div>
    </main>
  );
}
