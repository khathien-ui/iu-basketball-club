"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CoverUpload from "./CoverUpload";
import MarkdownEditor from "./MarkdownEditor";
import SlugField from "./SlugField";
import { slugify, isValidSlug } from "@/lib/events";
import { findAvailableSlug, writeWithUniqueSlug } from "@/lib/slug";
import { useSlugCheck } from "@/lib/useSlugCheck";
import {
  EXCERPT_LIMIT,
  formatClockTime,
  isoToLocalInput,
  localInputToIso,
  POST_CATEGORY_LABEL,
  POST_CATEGORY_ORDER,
  POST_COLUMNS,
  type PostCategory,
  type PostRow,
} from "@/lib/posts";

const AUTOSAVE_DELAY_MS = 4000;

interface Props {
  post: PostRow | null;
  authorId: string;
  onClose: () => void;
  onSaved: (post: PostRow, isNew: boolean, action: "draft" | "publish" | "auto") => void;
}

export default function PostEditor({ post, authorId, onClose, onSaved }: Props) {
  const [postId, setPostId] = useState<string | null>(post?.id ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [category, setCategory] = useState<PostCategory>(post?.category ?? "other");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(post?.cover_image_url ?? null);
  const [publishedAt, setPublishedAt] = useState(isoToLocalInput(post?.published_at ?? null));
  const [isPublished, setIsPublished] = useState(post?.is_published ?? false);

  const [saving, setSaving] = useState<null | "draft" | "publish" | "auto">(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = useRef(false);
  const savingRef = useRef(false);

  const year = useMemo(() => {
    const iso = localInputToIso(publishedAt);
    const d = iso ? new Date(iso) : new Date();
    return d.getFullYear();
  }, [publishedAt]);

  const slugCheck = useSlugCheck({
    table: "posts",
    slug,
    touched: slugTouched,
    year,
    excludeId: postId,
  });

  function markDirty() {
    dirty.current = true;
    setError(null);
  }

  function handleTitle(value: string) {
    setTitle(value);
    markDirty();
    if (!slugTouched) setSlug(slugify(value));
  }

  /** Lưu bài. publish = true chỉ khi bấm nút Đăng. */
  const save = useCallback(
    async (action: "draft" | "publish" | "auto"): Promise<PostRow | null> => {
      if (savingRef.current) return null;
      if (!title.trim()) {
        if (action !== "auto") setError("Vui lòng nhập tiêu đề bài viết.");
        return null;
      }

      const finalSlug = (slug.trim() || slugify(title)).trim();
      if (!isValidSlug(finalSlug)) {
        if (action !== "auto") {
          setError("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");
        }
        return null;
      }
      if (slugTouched && slugCheck.status === "taken") {
        if (action !== "auto") {
          setError(
            `Slug "${finalSlug}" đã được dùng.` +
            (slugCheck.suggestion ? ` Gợi ý: ${slugCheck.suggestion}.` : "")
          );
        }
        return null;
      }

      savingRef.current = true;
      setSaving(action);
      setError(null);

      try {
        const supabase = createClient();
        const slugQuery = { table: "posts" as const, base: finalSlug, year, excludeId: postId };

        const startSlug = slugTouched
          ? finalSlug
          : slugCheck.resolved || (await findAvailableSlug(supabase, slugQuery));

        const nextPublished = action === "publish" ? true : isPublished;

        const payload = {
          title: title.trim(),
          category,
          excerpt: excerpt.trim() || null,
          content: content.trim() || null,
          cover_image_url: coverUrl,
          published_at: localInputToIso(publishedAt),
          is_published: nextPublished,
        };

        const { data, slug: savedSlug } = await writeWithUniqueSlug<PostRow>(
          supabase,
          slugQuery,
          startSlug,
          async (candidate) => {
            if (postId) {
              return supabase
                .from("posts")
                .update({ ...payload, slug: candidate })
                .eq("id", postId)
                .select(POST_COLUMNS)
                .single();
            }
            return supabase
              .from("posts")
              .insert({ ...payload, slug: candidate, author_id: authorId })
              .select(POST_COLUMNS)
              .single();
          }
        );

        if (!data) throw new Error("Không nhận được dữ liệu sau khi lưu.");

        const wasNew = !postId;
        setPostId(data.id);
        setSlug(savedSlug);
        setIsPublished(data.is_published);
        if (data.published_at) setPublishedAt(isoToLocalInput(data.published_at));
        setLastSavedAt(new Date());
        dirty.current = false;

        onSaved(data, wasNew, action);
        return data;
      } catch (err) {
        const e = err as { code?: string; message?: string };
        console.error("[PostEditor] Lưu bài lỗi:", err);
        if (action !== "auto") {
          setError(
            e.code === "42501"
              ? "Bạn không có quyền tạo hoặc sửa bài viết."
              : "Không lưu được bài viết. Vui lòng thử lại."
          );
        }
        return null;
      } finally {
        savingRef.current = false;
        setSaving(null);
      }
    },
    [title, slug, slugTouched, slugCheck, category, excerpt, content, coverUrl,
     publishedAt, isPublished, postId, authorId, year, onSaved]
  );

  /**
   * Tự lưu nháp: chạy sau AUTOSAVE_DELAY_MS kể từ thay đổi cuối.
   * Bài mới sẽ được tạo ở dạng nháp ngay lần tự lưu đầu tiên, nhờ vậy
   * đóng tab giữa chừng vẫn không mất nội dung.
   */
  useEffect(() => {
    if (!title.trim()) return;
    const timer = setTimeout(() => {
      if (dirty.current && !savingRef.current) void save("auto");
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [title, slug, category, excerpt, content, coverUrl, publishedAt, save]);

  // Nhắc trước khi rời trang nếu còn thay đổi chưa lưu.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const excerptLeft = EXCERPT_LIMIT - excerpt.length;
  const excerptOver = excerptLeft < 0;

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-label="Soạn bài viết">
      <div className="editor-shell">
        <header className="editor-head">
          <div className="editor-head__left">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
              ← Đóng
            </button>
            <span className={`state-badge state-badge--${isPublished ? "open" : "closed"}`}>
              {isPublished ? "Đã đăng" : "Nháp"}
            </span>
            <span className="editor-head__status">
              {saving === "auto" && "Đang tự lưu…"}
              {saving === "draft" && "Đang lưu nháp…"}
              {saving === "publish" && "Đang đăng…"}
              {!saving && lastSavedAt && `Đã lưu lúc ${formatClockTime(lastSavedAt)}`}
              {!saving && !lastSavedAt && "Chưa lưu"}
            </span>
          </div>

          <div className="editor-head__actions">
            <button type="button" className="btn btn--ghost" disabled={!!saving}
              onClick={() => void save("draft")}>
              Lưu nháp
            </button>
            {isPublished ? (
              <button type="button" className="btn btn--ghost" disabled={!!saving}
                onClick={async () => { setIsPublished(false); markDirty(); await save("draft"); }}>
                Chuyển về nháp
              </button>
            ) : (
              <button type="button" className="btn btn--solid" disabled={!!saving}
                onClick={() => void save("publish")}>
                Đăng bài
              </button>
            )}
          </div>
        </header>

        {error && <p className="form-alert editor-alert" role="alert">{error}</p>}

        <div className="editor-body">
          <div className="editor-meta">
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="p_title">Tiêu đề <span className="req">*</span></label>
                <input id="p_title" value={title} onChange={(e) => handleTitle(e.target.value)}
                  placeholder="VD: Thắng đậm trận mở màn mùa giải" />
              </div>

              <SlugField
                id="p_slug"
                value={slug}
                check={slugCheck}
                pathPrefix="/news/"
                onChange={(v) => { setSlug(v); setSlugTouched(true); markDirty(); }}
                onApplySuggestion={(s) => { setSlug(s); setSlugTouched(true); markDirty(); }}
              />

              <div className="field">
                <label htmlFor="p_cat">Chuyên mục</label>
                <select id="p_cat" value={category}
                  onChange={(e) => { setCategory(e.target.value as PostCategory); markDirty(); }}>
                  {POST_CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>{POST_CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="p_date">Ngày đăng</label>
                <input id="p_date" type="datetime-local" value={publishedAt}
                  onChange={(e) => { setPublishedAt(e.target.value); markDirty(); }} />
                <span className="field__hint">Để trống = lấy thời điểm bấm đăng.</span>
              </div>

              <div className="field field--full">
                <label htmlFor="p_excerpt">
                  Đoạn tóm tắt
                  <span className={`char-count${excerptOver ? " is-over" : ""}`}>
                    {excerpt.length}/{EXCERPT_LIMIT}
                  </span>
                </label>
                <textarea id="p_excerpt" rows={2} value={excerpt}
                  onChange={(e) => { setExcerpt(e.target.value); markDirty(); }}
                  placeholder="Một hai câu tóm tắt, hiện ở trang chủ và danh sách tin." />
                <span className={`field__hint${excerptOver ? " field__error" : ""}`}>
                  {excerptOver
                    ? `Dài hơn ${EXCERPT_LIMIT} ký tự — phần thừa có thể bị cắt khi hiển thị.`
                    : "Hiện ở trang chủ và danh sách tin tức."}
                </span>
              </div>
            </div>

            <CoverUpload
              currentUrl={coverUrl}
              folder={`posts/${slug || "draft"}`}
              onUploaded={(url) => { setCoverUrl(url); markDirty(); }}
            />
          </div>

          <MarkdownEditor
            value={content}
            onChange={(v) => { setContent(v); markDirty(); }}
            folder={`posts/${slug || "draft"}`}
          />
        </div>
      </div>
    </div>
  );
}
