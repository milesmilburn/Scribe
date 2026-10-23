import { create } from "zustand";
import type { Token } from "../interfaces/Token";

interface SessionState {
  players: string[];
  tokens: Token[];
  setPlayers: (players: string[]) => void;
  setTokens: (tokens: Token[]) => void;
  upsertToken: (token: Token) => void;
  removeToken: (tokenId: number) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  players: [],
  tokens: [],
  setPlayers: (players) => set({ players }),
  setTokens: (tokens: Token[]) => set({ tokens }),

  upsertToken: (token: Token) =>
    set((state) => {
      const exists = state.tokens.some((t) => t.tokenId === token.tokenId);
      return {
        tokens: exists
          ? state.tokens.map((t) => (t.tokenId === token.tokenId ? token : t))
          : [...state.tokens, token],
      };
    }),

  removeToken: (tokenId: number) =>
    set((state) => ({
      tokens: state.tokens.filter((t) => t.tokenId !== tokenId),
    })),

  reset: () => set({ players: [], tokens: [] }),
}));