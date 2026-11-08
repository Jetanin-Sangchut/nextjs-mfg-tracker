export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://USER:PASSWORD@HOST:5432/mfg_tracker",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
}
