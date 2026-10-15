import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import * as signalr from "@microsoft/signalr";
import { API_BASE } from "../config";
import { useUserStore } from "../stores/useUserStore";
import { useSessionStore } from "../stores/useSessionStore";

export default function SessionView() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const gmToken = useUserStore((s) => (code ? s.gmTokens[code] : undefined)) ?? null;
  const displayName = useUserStore((s) => s.displayName);

  const setPlayers = useSessionStore((s) => s.setPlayers);
  const reset = useSessionStore((s) => s.reset);
  const players = useSessionStore((s) => s.players);

  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      async function validateSession() {
        try {
          const res = await fetch(`${API_BASE}/api/sessions/${code}`);

          if (!res.ok) {
            alert("Session is invalid or does not exist.");
            navigate("/")
            return;
          }

          setChecking(false);
        } catch {
          alert("Couldn't reach the server.");
          navigate("/")
        }
    }
    validateSession();
  }, [code, navigate])
  

  // SignalR effect
  useEffect(() => {
    if (checking || !displayName) return;

    const connection = new signalr.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/session`)
      .withAutomaticReconnect()
      .build();

    connection.on("PlayersChanged", (names: string[]) => setPlayers(names));

    // When a player reconnects, the session sees them as out of a group, so re-init
    connection.onreconnected(() => {
      connection.invoke("JoinSession", code, displayName, gmToken).catch(console.error);
    });

    // Start SignalR connection
    connection.start()
      .then(() => connection.invoke("JoinSession", code, displayName, gmToken))
      .catch(err => console.error("SignalR connection failed: ", err));

    return () => { 
      connection.stop(); 
      reset();
    };
  }, [checking, code, displayName, setPlayers, reset]);

  async function handleSessionEnd() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/sessions/${code}/end`, {method: "POST"});

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

  if(checking) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-600">Validating Session...</p>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Session: {code}</h1>
      <p className="text-slate-600 mb-8 text-center max-w-md">
        Hello, {displayName}, you're in a session! The session map and tools will go here at a later point.
      </p>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 mb-6 w-full max-w-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Connected ({players.length})
        </h2>
        <ul className="text-slate-900">
          {players.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}
        </ul>
      </div>

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