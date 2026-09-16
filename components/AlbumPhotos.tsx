"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "./ConfirmDialog";
import {
  FULL_DIMENSION,
  MAX_ALBUM_IMAGE_BYTES,
  resizeImageToJpeg,
  storagePathFromPublicUrl,
  THUMB_DIMENSION,
  uploadWithProgress,
  validateImageFile,
} from "@/lib/imageUpload";
import { PHOTO_COLUMNS, type AlbumRow, type PhotoRow } from "@/lib/albums";

interface Props {
  album: AlbumRow;
  initialPhotos: PhotoRow[];
  currentUserId: string;
  onCoverChange: (url: string | null) => void;
}

type JobStatus = "waiting" | "compressing" | "uploading" | "done" | "error";

interface UploadJob {
  id: string;
  name: string;
  status: JobStatus;
  percent: number;
  error?: string;
}

const STATUS_LABEL: Record<JobStatus, string> = {
  waiting: "Đang chờ",
  compressing: "Đang nén",
  uploading: "Đang tải lên",
  done: "Xong",
  error: "Lỗi",
};

export default function AlbumPhotos({ album, initialPhotos, currentUserId, onCoverChange }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<PhotoRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateJob = (id: string, patch: Partial<UploadJob>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  /** Nén thành 2 bản (gốc 1600px + thu nhỏ 400px) rồi tải cả hai lên. */
  const uploadOne = useCallback(
    async (file: File, jobId: string, orderBase: number, index: number): Promise<PhotoRow | null> => {
      const check = validateImageFile(file, MAX_ALBUM_IMAGE_BYTES);
      if (!check.ok) {
        updateJob(jobId, { status: "error", error: check.error });
        return null;
      }

      try {
        updateJob(jobId, { status: "compressing", percent: 5 });
        const [full, thumb] = await Promise.all([
          resizeImageToJpeg(file, FULL_DIMENSION),
          resizeImageToJpeg(file, THUMB_DIMENSION, 0.8),
        ]);

        const supabase = createClient();
        const stamp = `${Date.now()}-${index}`;
        const fullPath = `albums/${album.slug}/${stamp}.jpg`;
        const thumbPath = `albums/${album.slug}/thumbs/${stamp}.jpg`;

        updateJob(jobId, { status: "uploading", percent: 10 });

        // Ảnh gốc chiếm phần lớn dung lượng nên quy về 10–90% của thanh tiến trình.
        const fullResult = await uploadWithProgress(
          supabase, "media", fullPath, full,
          (p) => updateJob(jobId, { percent: 10 + Math.round(p * 0.8) })
        );
        if (fullResult.error) {
          updateJob(jobId, { status: "error", error: fullResult.error });
          return null;
        }

        const thumbResult = await uploadWithProgress(
          supabase, "media", thumbPath, thumb,
          (p) => updateJob(jobId, { percent: 90 + Math.round(p * 0.1) })
        );
        if (thumbResult.error) {
          updateJob(jobId, { status: "error", error: thumbResult.error });
          return null;
        }

        const imageUrl = supabase.storage.from("media").getPublicUrl(fullPath).data.publicUrl;
        const thumbUrl = supabase.storage.from("media").getPublicUrl(thumbPath).data.publicUrl;

        const { data, error } = await supabase
          .from("photos")
          .insert({
            album_id: album.id,
            image_url: imageUrl,
            thumbnail_url: thumbUrl,
            sort_order: orderBase + index,
            uploaded_by: currentUserId,
          })
          .select(PHOTO_COLUMNS)
          .single();

        if (error) {
          console.error("[AlbumPhotos] Lưu ảnh vào database lỗi:", error);
          updateJob(jobId, {
            status: "error",
            error: error.code === "42501"
              ? "Bạn không có quyền thêm ảnh."
              : "Không lưu được ảnh.",
          });
          return null;
        }

        updateJob(jobId, { status: "done", percent: 100 });
        return data as PhotoRow;
      } catch (err) {
        console.error("[AlbumPhotos] Lỗi xử lý ảnh:", err);
        updateJob(jobId, { status: "error", error: "Không xử lý được ảnh." });
        return null;
      }
    },
    [album.id, album.slug, currentUserId]
  );

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setAlert(null);

    const newJobs: UploadJob[] = list.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      status: "waiting",
      percent: 0,
    }));
    setJobs(newJobs);

    const orderBase = photos.length > 0
      ? Math.max(...photos.map((p) => p.sort_order)) + 1
      : 0;

    // Tải tuần tự để thanh tiến trình từng ảnh dễ theo dõi và không nghẽn mạng.
    const added: PhotoRow[] = [];
    for (let i = 0; i < list.length; i++) {
      const row = await uploadOne(list[i], newJobs[i].id, orderBase, i);
      if (row) {
        added.push(row);
        setPhotos((ps) => [...ps, row]);
      }
    }

    const failed = newJobs.length - added.length;
    setAlert({
      kind: failed > 0 ? "error" : "success",
      text: failed > 0
        ? `Đã tải lên ${added.length}/${newJobs.length} ảnh, ${failed} ảnh lỗi.`
        : `Đã tải lên ${added.length} ảnh.`,
    });

    // Album chưa có bìa thì lấy ảnh đầu tiên làm bìa.
    if (!album.cover_image_url && added.length > 0) {
      await setCover(added[0], true);
    }

    router.refresh();
    setTimeout(() => setJobs([]), 4000);
  }

  async function saveOrder(next: PhotoRow[]) {
    setPhotos(next);
    try {
      const supabase = createClient();
      // Cập nhật lần lượt: số ảnh mỗi album không lớn.
      await Promise.all(
        next.map((p, i) =>
          p.sort_order === i
            ? Promise.resolve()
            : supabase.from("photos").update({ sort_order: i }).eq("id", p.id)
        )
      );
      setPhotos(next.map((p, i) => ({ ...p, sort_order: i })));
      router.refresh();
    } catch (err) {
      console.error("[AlbumPhotos] Lưu thứ tự lỗi:", err);
      setAlert({ kind: "error", text: "Không lưu được thứ tự ảnh." });
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void saveOrder(next);
  }

  async function saveCaption(photo: PhotoRow) {
    const caption = captionDraft.trim() || null;
    setEditingCaption(null);
    if (caption === photo.caption) return;

    setPhotos((ps) => ps.map((p) => (p.id === photo.id ? { ...p, caption } : p)));
    try {
      const supabase = createClient();
      const { error } = await supabase.from("photos").update({ caption }).eq("id", photo.id);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error("[AlbumPhotos] Lưu chú thích lỗi:", err);
      setAlert({ kind: "error", text: "Không lưu được chú thích." });
    }
  }

  async function setCover(photo: PhotoRow, silent = false) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("albums")
        .update({ cover_image_url: photo.image_url })
        .eq("id", album.id);
      if (error) throw error;
      onCoverChange(photo.image_url);
      if (!silent) setAlert({ kind: "success", text: "Đã đặt làm ảnh bìa album." });
      router.refresh();
    } catch (err) {
      console.error("[AlbumPhotos] Đặt ảnh bìa lỗi:", err);
      setAlert({ kind: "error", text: "Không đặt được ảnh bìa." });
    }
  }

  async function deletePhoto(photo: PhotoRow) {
    setBusyId(photo.id);
    try {
      const supabase = createClient();

      // Xoá file trên Storage trước, rồi mới xoá bản ghi.
      const paths = [photo.image_url, photo.thumbnail_url]
        .filter((u): u is string => !!u)
        .map((u) => storagePathFromPublicUrl(u, "media"))
        .filter((p): p is string => !!p);

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from("media").remove(paths);
        if (storageError) {
          // Không chặn việc xoá bản ghi: file mồ côi còn hơn ảnh hỏng trong album.
          console.error("[AlbumPhotos] Xoá file trên Storage lỗi:", storageError);
        }
      }

      const { error } = await supabase.from("photos").delete().eq("id", photo.id);
      if (error) throw error;

      const next = photos.filter((p) => p.id !== photo.id);
      setPhotos(next);

      if (album.cover_image_url === photo.image_url) {
        const replacement = next[0]?.image_url ?? null;
        await supabase.from("albums").update({ cover_image_url: replacement }).eq("id", album.id);
        onCoverChange(replacement);
      }

      setAlert({ kind: "success", text: "Đã xoá ảnh." });
      router.refresh();
    } catch (err) {
      console.error("[AlbumPhotos] Xoá ảnh lỗi:", err);
      setAlert({ kind: "error", text: "Không xoá được ảnh." });
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  const uploading = jobs.some((j) => j.status !== "done" && j.status !== "error");

  return (
    <div className="album-photos">
      <div
        className={`dropzone${dragOver ? " is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") fileRef.current?.click(); }}
      >
        <span className="dropzone__icon" aria-hidden="true">🖼</span>
        <strong>Kéo thả ảnh vào đây</strong>
        <span className="field__hint">
          hoặc bấm để chọn nhiều ảnh · JPG, PNG, WEBP · tối đa 10MB mỗi ảnh
        </span>
        <span className="field__hint">
          Ảnh được nén về {FULL_DIMENSION}px và tạo bản thu nhỏ {THUMB_DIMENSION}px trước khi tải lên.
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {jobs.length > 0 && (
        <ul className="upload-list">
          {jobs.map((j) => (
            <li key={j.id} className={`upload-item upload-item--${j.status}`}>
              <div className="upload-item__head">
                <span className="upload-item__name">{j.name}</span>
                <span className="upload-item__status">
                  {j.status === "error" ? j.error ?? STATUS_LABEL.error : STATUS_LABEL[j.status]}
                  {j.status === "uploading" && ` ${j.percent}%`}
                </span>
              </div>
              <div className="upload-bar">
                <span className="upload-bar__fill" style={{ width: `${j.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      <div className="album-photos__head">
        <h2 className="session-detail__subtitle">Ảnh trong album ({photos.length})</h2>
        {photos.length > 1 && (
          <span className="field__hint">
            Kéo thả ảnh để sắp xếp, hoặc dùng nút ◀ ▶ trên điện thoại.
          </span>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>Album chưa có ảnh nào. Kéo thả hoặc chọn ảnh ở khung trên.</p>
        </div>
      ) : (
        <ul className="photo-grid">
          {photos.map((photo, i) => (
            <li
              key={photo.id}
              className={`photo-card${dragIndex === i ? " is-dragging" : ""}${busyId === photo.id ? " is-saving" : ""}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
            >
              <div className="photo-card__media">
                <img src={photo.thumbnail_url ?? photo.image_url} alt={photo.caption ?? ""} loading="lazy" />
                {album.cover_image_url === photo.image_url && (
                  <span className="photo-card__cover-tag">Ảnh bìa</span>
                )}
                <span className="photo-card__order mono">{i + 1}</span>
              </div>

              <div className="photo-card__body">
                {editingCaption === photo.id ? (
                  <input
                    className="photo-card__caption-input"
                    value={captionDraft}
                    autoFocus
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    onBlur={() => void saveCaption(photo)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); void saveCaption(photo); }
                      if (e.key === "Escape") setEditingCaption(null);
                    }}
                    placeholder="Chú thích ảnh…"
                  />
                ) : (
                  <button
                    type="button"
                    className="photo-card__caption"
                    onClick={() => { setEditingCaption(photo.id); setCaptionDraft(photo.caption ?? ""); }}
                    title="Bấm để sửa chú thích"
                  >
                    {photo.caption || <span className="text-faint">Thêm chú thích…</span>}
                  </button>
                )}

                <div className="photo-card__actions">
                  <button type="button" className="btn btn--ghost btn--sm"
                    onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Chuyển lên trước">◀</button>
                  <button type="button" className="btn btn--ghost btn--sm"
                    onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Chuyển xuống sau">▶</button>
                  <button type="button" className="btn btn--ghost btn--sm"
                    onClick={() => void setCover(photo)}
                    disabled={album.cover_image_url === photo.image_url}>
                    Làm bìa
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm"
                    onClick={() => setConfirmDelete(photo)}>Xoá</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploading && <p className="field__hint">Đang tải ảnh lên, vui lòng không đóng trang…</p>}

      {confirmDelete && (
        <ConfirmDialog
          title="Xoá ảnh?"
          message="Ảnh sẽ bị xoá khỏi album và xoá luôn file trên Storage. Không thể hoàn tác."
          confirmLabel="Xoá ảnh"
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void deletePhoto(confirmDelete)}
        />
      )}
    </div>
  );
}
