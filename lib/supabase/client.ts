import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client cho Client Components ("use client").
 * Chỉ dùng anon key — mọi quyền truy cập dữ liệu do RLS quyết định.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
