"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_DIMENSION = 800;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  userId: string;
  currentUrl: string | null;
  fallback: string;
  onUploaded: (url: string) => void;
}

/** Thu nhỏ ảnh về tối đa 800px cạnh dài rồi nén lại thành JPEG. */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
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
      0.85
    );
  });
}

export default function AvatarUpload({ userId, currentUrl, fallback, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ảnh phải nhỏ hơn 5MB.");
      return;
    }

    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const path = `${userId}/${Date.now()}.jpg`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) {
        console.error("[AvatarUpload] Upload lỗi:", uploadError);
        setError("Không tải được ảnh lên. Vui lòng thử lại.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPreview(data.publicUrl);
      onUploaded(data.publicUrl);
    } catch (err) {
      console.error("[AvatarUpload] Lỗi xử lý ảnh:", err);
      setError("Không xử lý được ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="avatar-upload">
      <div className="avatar avatar--lg">
        {preview ? <img src={preview} alt="" /> : <span>{fallback}</span>}
      </div>

      <div className="avatar-upload__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Đang tải lên…" : "Đổi ảnh đại diện"}
        </button>
        <span className="field__hint">JPG, PNG hoặc WEBP, tối đa 5MB.</span>
        {error && <span className="field__error">{error}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        hidden
      />
    </div>
  );
}
