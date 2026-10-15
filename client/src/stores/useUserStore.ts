import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  displayName: string;
  gmTokens: Record<string, string>;
  setDisplayName: (name: string) => void;
  setGmToken: (code: string, token: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      displayName: "",
      gmTokens: {},
      setDisplayName: (name) => set({ displayName: name }),
      setGmToken: (code, token) => set((state) => ({gmTokens: { ...state.gmTokens, [code]: token} })),
    }),
    {
      name: "scribe-user",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);