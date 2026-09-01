import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client dùng service_role — BỎ QUA toàn bộ RLS.
 * CHỈ được import trong API route / server code. Không bao giờ import vào
 * client component: key không có tiền tố NEXT_PUBLIC_ nên sẽ là undefined
 * ở trình duyệt, và nếu lộ thì toàn bộ dữ liệu bị đọc/ghi tự do.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
