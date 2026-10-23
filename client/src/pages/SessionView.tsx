import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import * as signalr from "@microsoft/signalr";
import { API_BASE, validateDisplayName } from "../config";
import { useUserStore } from "../stores/useUserStore";
import { useSessionStore } from "../stores/useSessionStore";
import MapCanvas from "../components/MapCanvas";
import type { Token } from "../interfaces/Token";

export default function SessionView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const connectionRef = useRef<signalr.HubConnection | null>(null);
  
  const gmToken = useUserStore((s) => (code ? s.gmTokens[code] : undefined)) ?? null;
  const displayName = useUserStore((s) => s.displayName);
  const setDisplayName = useUserStore((s) => s.setDisplayName)

  // Players
  const setPlayers = useSessionStore((s) => s.setPlayers);
  const players = useSessionStore((s) => s.players);

  // Tokens
  const setTokens = useSessionStore((s) => s.setTokens);
  const upsertToken = useSessionStore((s) => s.upsertToken);
  const removeToken = useSessionStore((s) => s.removeToken);
  const tokens = useSessionStore((s) => s.tokens);

  const reset = useSessionStore((s) => s.reset);

  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidDisplayName, setIsValidDisplayName] = useState(false);

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
          return;
        }
        
        if(displayName) setIsValidDisplayName(true);

        const res = await fetch(`${API_BASE}/api/sessions/${code}/tokens`);
        if (!res.ok) {
          console.error("Failed to load tokens:", res.status);
          return;
        }

        const tokens: Token[] = await res.json();
        setTokens(tokens);
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

    connectionRef.current = connection;

    connection.on("PlayersChanged", (names: string[]) => setPlayers(names));
    connection.on("TokenPlaced", (t: Token) => upsertToken(t));
    connection.on("TokenMoved", (t: Token) => upsertToken(t));
    connection.on("TokenRemoved", (id: number) => removeToken(id));

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

  async function handleAddToken() {
    const color = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    try {
      await connectionRef.current?.invoke("PlaceToken", 500, 500, `Token ${tokens.length + 1}`, color);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place token.");
    }
  }

  async function handleRemoveToken(tokenId: number) {
    try {
      await connectionRef.current?.invoke("RemoveToken", tokenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove token.");
    }
  }

  const handleTokenMove = useCallback(async (tokenId: number, x: number, y: number) => {
    try {
      await connectionRef.current?.invoke("MoveToken", tokenId, x, y);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move token.");
    }
  }, []);

  if (!isValidDisplayName) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg justify-center shadow-sm p-6 mb-6 w-full max-w-sm space-y-4">
        <p className="text-md tracking-tight text-slate-900 mb-2">Display Name:</p>
        <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={24}
            placeholder="Example Name"
            className="flex-1 w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <button
            onClick={() => setIsValidDisplayName(true)}
            disabled={!validateDisplayName(displayName)}
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
            Join
          </button>
      </div>
    );
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
      <h1 className="text-4xl font-bold text-slate-900 mb-2 mt-4">Scribe</h1>
      <MapCanvas canDrag={gmToken !== null} onTokenMove={handleTokenMove} />
      <h1 className="text-xl font-bold text-slate-900 mb-2 mt-4">Session: {code}</h1>
      <p className="text-slate-600 mb-4 text-center max-w-md">
        Hello, {displayName}, you're in a session!
       </p>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 mb-6 mt-4 w-full max-w-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Connected ({players.length})
        </h2>
        <ul className="text-slate-900">
          {players.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}
        </ul>
      </div>
      
      {gmToken && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 mb-6 w-full max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-700">Tokens ({tokens.length})</h2>
            <button
              onClick={handleAddToken}
              className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-3 py-1 rounded-md cursor-pointer transition-colors"
            >
              Add Token
            </button>
          </div>

          <ul className="space-y-1">
            {tokens.map((t) => (
              <li key={t.tokenId} className="flex items-center gap-2 text-slate-900">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="flex-1">{t.label}</span>
                <button
                  onClick={() => handleRemoveToken(t.tokenId)}
                  className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      { gmToken &&
        <button
          onClick={handleSessionEnd}
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          End Session
        </button>
      }

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
    </div>
  );
}