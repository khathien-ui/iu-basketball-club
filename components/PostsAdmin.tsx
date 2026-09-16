"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostEditor from "./PostEditor";
import ConfirmDialog from "./ConfirmDialog";
import {
  formatPostDate,
  POST_CATEGORY_LABEL,
  POST_CATEGORY_ORDER,
  type PostCategory,
  type PostRow,
} from "@/lib/posts";

type PublishFilter = "all" | "published" | "draft";

interface Props {
  initialPosts: PostRow[];
  /** id tác giả -> tên hiển thị */
  authorNames: Record<string, string>;
  currentUserId: string;
}

export default function PostsAdmin({ initialPosts, authorNames, currentUserId }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PostRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter((p) => p.is_published).length,
    draft: posts.filter((p) => !p.is_published).length,
  }), [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) =>
        publishFilter === "all" ||
        (publishFilter === "published" ? p.is_published : !p.is_published)
      )
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.slug.includes(q));
  }, [posts, publishFilter, categoryFilter, query]);

  async function togglePublish(post: PostRow) {
    setAlert(null);
    setBusyId(post.id);
    const next = !post.is_published;
    const previous = posts;
    setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, is_published: next } : p)));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .update({ is_published: next })
        .eq("id", post.id);

      if (error) {
        setPosts(previous);
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? "Bạn không có quyền thay đổi bài viết này."
            : "Không cập nhật được trạng thái. Vui lòng thử lại.",
        });
        return;
      }
      setAlert({ kind: "success", text: next ? "Đã đăng bài." : "Đã chuyển về nháp." });
      router.refresh();
    } catch {
      setPosts(previous);
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(post: PostRow) {
    setAlert(null);
    setBusyId(post.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) {
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? "Bạn không có quyền xoá bài viết này."
            : "Không xoá được bài viết. Vui lòng thử lại.",
        });
        return;
      }
      setPosts((ps) => ps.filter((p) => p.id !== post.id));
      setAlert({ kind: "success", text: `Đã xoá bài “${post.title}”.` });
      router.refresh();
    } catch {
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  function handleSaved(saved: PostRow, isNew: boolean, action: "draft" | "publish" | "auto") {
    setPosts((ps) => (isNew ? [saved, ...ps] : ps.map((p) => (p.id === saved.id ? saved : p))));
    if (action !== "auto") {
      setAlert({
        kind: "success",
        text: action === "publish"
          ? `Đã đăng bài · /news/${saved.slug}`
          : `Đã lưu nháp · /news/${saved.slug}`,
      });
    }
    router.refresh();
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.total}</span>
          <span className="stat-card__label">Tổng bài viết</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.published}</span>
          <span className="stat-card__label">Đã đăng</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.draft}</span>
          <span className="stat-card__label">Bản nháp</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search field">
          <label htmlFor="poSearch" className="sr-only">Tìm theo tiêu đề</label>
          <input id="poSearch" type="search" value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc slug…" />
        </div>

        <div className="field">
          <label htmlFor="poPublish" className="sr-only">Lọc theo trạng thái</label>
          <select id="poPublish" value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã đăng</option>
            <option value="draft">Nháp</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="poCat" className="sr-only">Lọc theo chuyên mục</label>
          <select id="poCat" value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PostCategory | "all")}>
            <option value="all">Tất cả chuyên mục</option>
            {POST_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{POST_CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn--solid" onClick={() => setCreating(true)}>
          Viết bài
        </button>
      </div>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      <p className="recruits__count">Hiển thị {filtered.length} / {posts.length} bài viết</p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>{posts.length === 0 ? "Chưa có bài viết nào. Bấm “Viết bài” để bắt đầu." : "Không có bài viết khớp bộ lọc."}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bài viết</th>
                <th>Chuyên mục</th>
                <th>Tác giả</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={busyId === p.id ? "is-saving" : undefined}>
                  <td data-label="Bài viết">
                    <span className="event-cell">
                      {p.cover_image_url ? (
                        <img className="event-cell__thumb" src={p.cover_image_url} alt="" />
                      ) : (
                        <span className="event-cell__thumb event-cell__thumb--empty" aria-hidden="true" />
                      )}
                      <span className="member-cell__text">
                        <strong>{p.title}</strong>
                        <em className="mono">/{p.slug}</em>
                      </span>
                    </span>
                  </td>
                  <td data-label="Chuyên mục">
                    <span className="pos-chip">{POST_CATEGORY_LABEL[p.category]}</span>
                  </td>
                  <td data-label="Tác giả">
                    {p.author_id
                      ? authorNames[p.author_id] ?? "(không rõ)"
                      : "—"}
                    {p.author_id === currentUserId && <span className="you-tag">bạn</span>}
                  </td>
                  <td data-label="Ngày đăng" className="mono nowrap">
                    {formatPostDate(p.published_at)}
                  </td>
                  <td data-label="Trạng thái">
                    <span className={`state-badge state-badge--${p.is_published ? "open" : "closed"}`}>
                      {p.is_published ? "Đã đăng" : "Nháp"}
                    </span>
                  </td>
                  <td data-label="">
                    <div className="mark-actions">
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === p.id} onClick={() => togglePublish(p)}>
                        {p.is_published ? "Ẩn" : "Đăng"}
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === p.id} onClick={() => setEditing(p)}>
                        Sửa
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === p.id} onClick={() => setConfirmDelete(p)}>
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <PostEditor
          post={editing}
          authorId={currentUserId}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xoá bài viết?"
          message={`Bài “${confirmDelete.title}” sẽ bị xoá vĩnh viễn. Không thể hoàn tác.`}
          confirmLabel="Xoá bài viết"
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}
