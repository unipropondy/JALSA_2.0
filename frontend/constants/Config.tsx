// Resolve API_URL to the production environment for client builds, but allow local overrides during development.
export const API_URL = (process.env.NODE_ENV === "production")
  ? "https://jalsa20-production.up.railway.app"
  : (process.env.EXPO_PUBLIC_API_URL || "https://jalsa20-production.up.railway.app");

console.log(`🌐 [Config] API_URL: ${API_URL} | Platform: ${require('react-native').Platform.OS} | Env: ${process.env.NODE_ENV}`);
