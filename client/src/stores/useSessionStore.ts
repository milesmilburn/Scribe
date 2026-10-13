import { create } from "zustand";

interface SessionState {
  players: string[];
  setPlayers: (players: string[]) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  players: [],
  setPlayers: (players) => set({ players }),
  reset: () => set({ players: [] }),
}));