import { neon } from "@neondatabase/serverless";
export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured");
  const sql = neon(url);
  return {
    query: async (text, params = []) => ({
      rows: await sql.query(text, params),
    }),
    transaction: async (text, params = []) => {
      const [rows] = await sql.transaction([sql.query(text, params)]);
      return { rows };
    },
  };
}
