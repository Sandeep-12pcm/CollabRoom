// Export ADMIN_EMAILS by reading from the Vite environment variable.
// We allow comma-separated emails, e.g., "admin1@example.com, admin2@example.com"
export const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email: string | undefined) => email?.trim())
  .filter(Boolean);
