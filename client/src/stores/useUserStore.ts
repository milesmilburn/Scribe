import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  displayName: string;
  setDisplayName: (name: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      displayName: "",
      setDisplayName: (name) => set({ displayName: name }),
    }),
    {
      name: "scribe-user",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);