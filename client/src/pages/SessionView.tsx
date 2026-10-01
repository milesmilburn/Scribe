import { useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function SessionView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const BASE_API = "http://localhost:5255";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSessionEnd() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${BASE_API}/api/sessions/${code}/end`, {method: "POST"});

      if (!res.ok) {
        setError("Could not end session.")
        return;
      }

      navigate("/");
    } catch {
      setError("Could not reach the server.")
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Session: {code}</h1>
      <p className="text-slate-600 mb-8 text-center max-w-md">
        You're in a session! The session map and tools will go here at a later point.
      </p>

      <button
        onClick={handleSessionEnd}
        disabled={loading}
        className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        End Session
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
    </div>
  );
}