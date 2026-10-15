export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5255";
export const HUB_URL = `${API_BASE}/hubs/session`;

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 1000;


// A display name should be at least 3 characters long
export function validateDisplayName(name: string) {
    return name.trim().length > 2;
}