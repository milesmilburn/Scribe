import { useState } from "react";
import { useNavigate } from "react-router";

const BASE_API = "http://localhost:5255";

export default function Landing() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSessionCreate() {
    setError(null);
    setLoading(true);

    try {
      // Create new request and get back the created session details in the res variable
      const res = await fetch(`${BASE_API}/api/sessions`, {method: "POST"});
      if (!res.ok) {
        setError("Could not create session.")
        return;
      }

      const session = await res.json();
      navigate(`/session/${session.joinCode}/created`);
    } catch {
      setError("Could not reach the server.")
    } finally {
      setLoading(false);
    }
  }

  async function handleSessionJoin() {
    if(!joinCode.trim()) {
      setError("Enter a session code.")
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetch(`${BASE_API}/api/sessions/${code}`);

      if (res.status === 404) {
        setError("Session not found.");
        return;
      }
      if (res.status === 409) {
        setError("That session has ended.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong.");
        return;
      }

      await fetch(`${BASE_API}/sessions/${code}/join`, {method: "POST"});
      navigate(`/session/${code}`);
    } catch {
      setError("Could not reach the server.")
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-8">Scribe</h1>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 w-full max-w-sm space-y-4">
        <button
          onClick={handleSessionCreate}
          disabled={loading}
          className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Session
        </button>

        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-px bg-slate-200 flex-1" />
          or
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Session Code"
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <button
            onClick={handleSessionJoin}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Join
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}