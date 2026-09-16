import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Ảnh album được phép nặng hơn ảnh bìa vì có nén lại trước khi tải lên. */
export const MAX_ALBUM_IMAGE_BYTES = 10 * 1024 * 1024;

/** Cạnh dài tối đa của ảnh gốc và ảnh thu nhỏ trong album. */
export const FULL_DIMENSION = 1600;
export const THUMB_DIMENSION = 400;

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
}

export function validateImageFile(
  file: File,
  maxBytes: number = MAX_IMAGE_BYTES
): ImageValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Chỉ nhận ảnh JPG, PNG hoặc WEBP." };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Ảnh phải nhỏ hơn ${mb}MB.` };
  }
  return { ok: true };
}

/**
 * Thu nhỏ ảnh về tối đa `maxDimension` px cạnh dài rồi nén thành JPEG.
 * Ảnh nhỏ hơn giới hạn thì giữ nguyên kích thước, chỉ nén lại.
 */
export async function resizeImageToJpeg(
  file: File,
  maxDimension: number,
  quality = 0.85
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Không nén được ảnh."))),
      "image/jpeg",
      quality
    );
  });
}

/**
 * Tải file lên Supabase Storage kèm tiến trình thật theo byte.
 *
 * supabase-js không báo tiến trình upload, nên gọi thẳng REST endpoint của
 * Storage bằng XMLHttpRequest — đúng endpoint mà supabase-js dùng bên trong,
 * chỉ khác là XHR cho phép theo dõi sự kiện `progress`.
 */
export async function uploadWithProgress(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<{ error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { error: "Chưa cấu hình Supabase." };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? anonKey;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/storage/v1/object/${bucket}/${path}`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", blob.type || "image/jpeg");
    xhr.setRequestHeader("x-upsert", "true");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ error: null });
        return;
      }
      let message = `Tải lên thất bại (mã ${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (typeof body?.message === "string") {
          message = /row-level security|Unauthorized/i.test(body.message)
            ? "Bạn không có quyền tải ảnh lên."
            : body.message;
        }
      } catch {
        // giữ thông báo mặc định
      }
      console.error("[uploadWithProgress] Lỗi:", xhr.status, xhr.responseText);
      resolve({ error: message });
    };

    xhr.onerror = () => {
      console.error("[uploadWithProgress] Lỗi mạng khi tải ảnh lên.");
      resolve({ error: "Không kết nối được máy chủ khi tải ảnh lên." });
    };

    xhr.send(blob);
  });
}

/**
 * Lấy đường dẫn trong bucket từ URL công khai.
 * VD .../storage/v1/object/public/media/albums/x/1.jpg -> albums/x/1.jpg
 */
export function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}
