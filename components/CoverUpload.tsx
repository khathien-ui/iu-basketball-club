"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImageToJpeg, validateImageFile } from "@/lib/imageUpload";

const MAX_DIMENSION = 1600;

interface Props {
  currentUrl: string | null;
  /** Thư mục trong bucket media, ví dụ "events/tuyen-quan-mua-thu". */
  folder: string;
  onUploaded: (url: string | null) => void;
}

export default function CoverUpload({ currentUrl, folder, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setError(null);

    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.error ?? "Ảnh không hợp lệ.");
      return;
    }

    setUploading(true);
    try {
      const blob = await resizeImageToJpeg(file, MAX_DIMENSION);
      const path = `${folder}/${Date.now()}.jpg`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) {
        console.error("[CoverUpload] Upload lỗi:", uploadError);
        setError(
          uploadError.message.toLowerCase().includes("row-level security")
            ? "Bạn không có quyền tải ảnh lên."
            : "Không tải được ảnh lên. Vui lòng thử lại."
        );
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setPreview(data.publicUrl);
      onUploaded(data.publicUrl);
    } catch (err) {
      console.error("[CoverUpload] Lỗi xử lý ảnh:", err);
      setError("Không xử lý được ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    setPreview(null);
    onUploaded(null);
    setError(null);
  }

  return (
    <div className="cover-upload">
      <div className="cover-upload__preview">
        {preview ? (
          <img src={preview} alt="Ảnh bìa sự kiện" />
        ) : (
          <span className="cover-upload__placeholder">Chưa có ảnh bìa</span>
        )}
      </div>

      <div className="cover-upload__actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Đang tải lên…" : preview ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
        </button>
        {preview && !uploading && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clear}>
            Gỡ ảnh
          </button>
        )}
        <span className="field__hint">JPG, PNG hoặc WEBP, tối đa 5MB. Ảnh tự thu về 1600px.</span>
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
