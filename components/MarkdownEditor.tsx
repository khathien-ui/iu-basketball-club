"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImageToJpeg, validateImageFile } from "@/lib/imageUpload";
import PostContent from "./PostContent";
import {
  buildImageMarkdown,
  IMAGE_ALIGNS,
  IMAGE_ALIGN_LABEL,
  IMAGE_PATTERN,
  IMAGE_SIZES,
  IMAGE_SIZE_LABEL,
  type ImageAlign,
  type ImageSize,
} from "@/lib/markdown";
import {
  handleBackspace,
  handleCodeFenceEnter,
  handleEnter,
  handleTab,
} from "@/lib/listEditing";

const MAX_DIMENSION = 1600;

interface Props {
  value: string;
  onChange: (value: string) => void;
  folder: string;
}

type Tool = "bold" | "italic" | "heading" | "ul" | "ol" | "quote" | "link" | "code";

const TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "bold", label: "B", title: "In đậm (Ctrl+B)" },
  { id: "italic", label: "I", title: "In nghiêng (Ctrl+I)" },
  { id: "heading", label: "H2", title: "Tiêu đề" },
  { id: "ul", label: "• —", title: "Danh sách" },
  { id: "ol", label: "1.", title: "Danh sách đánh số" },
  { id: "quote", label: "❝", title: "Trích dẫn" },
  { id: "code", label: "</>", title: "Mã" },
  { id: "link", label: "🔗", title: "Chèn liên kết" },
];

/** Ảnh mà con trỏ đang đứng trong phạm vi cú pháp của nó. */
interface ImageAtCursor {
  start: number;
  end: number;
  alt: string;
  url: string;
  caption: string;
  size: ImageSize;
  align: ImageAlign;
}

function findImageAtCursor(text: string, cursor: number): ImageAtCursor | null {
  const re = new RegExp(IMAGE_PATTERN.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (cursor >= start && cursor <= end) {
      let size: ImageSize = "large";
      let align: ImageAlign = "center";
      for (const token of (m[4] ?? "").trim().split(/\s+/)) {
        const [k, v] = token.split("=");
        if (k === "size" && (IMAGE_SIZES as readonly string[]).includes(v)) size = v as ImageSize;
        if (k === "align" && (IMAGE_ALIGNS as readonly string[]).includes(v)) align = v as ImageAlign;
      }
      return { start, end, alt: m[1] ?? "", url: m[2], caption: m[3] ?? "", size, align };
    }
  }
  return null;
}

export default function MarkdownEditor({ value, onChange, folder }: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);

  // Tuỳ chọn cho lần chèn ảnh sắp tới.
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imgSize, setImgSize] = useState<ImageSize>("large");
  const [imgAlign, setImgAlign] = useState<ImageAlign>("center");
  const [imgCaption, setImgCaption] = useState("");

  const selectedImage = useMemo(() => findImageAtCursor(value, cursor), [value, cursor]);

  function apply(next: { text: string; start: number; end: number }) {
    onChange(next.text);
    requestAnimationFrame(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.start, next.end);
      setCursor(next.start);
    });
  }

  function syncCursor() {
    const el = areaRef.current;
    if (el) setCursor(el.selectionStart);
  }

  function replaceSelection(build: (selected: string) => { text: string; cursor?: number }) {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const { text, cursor: c } = build(value.slice(start, end));
    const pos = start + (c ?? text.length);
    apply({ text: value.slice(0, start) + text + value.slice(end), start: pos, end: pos });
  }

  function prefixLines(prefix: string | ((i: number) => string)) {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const sliceEnd = lineEnd === -1 ? value.length : lineEnd;

    const updated = value
      .slice(lineStart, sliceEnd)
      .split("\n")
      .map((line, i) => {
        const p = typeof prefix === "string" ? prefix : prefix(i);
        return line.startsWith(p) ? line.slice(p.length) : p + line;
      })
      .join("\n");

    apply({
      text: value.slice(0, lineStart) + updated + value.slice(sliceEnd),
      start: lineStart,
      end: lineStart + updated.length,
    });
  }

  function applyTool(tool: Tool) {
    switch (tool) {
      case "bold":
        return replaceSelection((s) => ({ text: `**${s || "chữ đậm"}**`, cursor: s ? undefined : 2 }));
      case "italic":
        return replaceSelection((s) => ({ text: `*${s || "chữ nghiêng"}*`, cursor: s ? undefined : 1 }));
      case "code":
        return replaceSelection((s) => ({ text: `\`${s || "mã"}\``, cursor: s ? undefined : 1 }));
      case "heading": return prefixLines("## ");
      case "ul": return prefixLines("- ");
      case "ol": return prefixLines((i) => `${i + 1}. `);
      case "quote": return prefixLines("> ");
      case "link":
        return replaceSelection((s) => ({
          text: `[${s || "nội dung liên kết"}](https://)`,
          cursor: s ? s.length + 3 : 1,
        }));
    }
  }

  /** Đổi kích thước / căn lề của ảnh đang chọn, không cần chèn lại. */
  function updateSelectedImage(patch: Partial<Pick<ImageAtCursor, "size" | "align">>) {
    if (!selectedImage) return;
    const { start, end, alt, url, caption, size, align } = selectedImage;
    const next = buildImageMarkdown(
      alt, url, caption,
      patch.size ?? size,
      patch.align ?? align
    );
    const caret = start + next.length;
    apply({ text: value.slice(0, start) + next + value.slice(end), start: caret, end: caret });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const state = { text: value, start: el.selectionStart, end: el.selectionEnd };

    // Phím tắt định dạng giữ nguyên như cũ.
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") { e.preventDefault(); applyTool("bold"); }
      if (key === "i") { e.preventDefault(); applyTool("italic"); }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      const fence = handleCodeFenceEnter(state);
      if (fence) { e.preventDefault(); apply(fence); return; }
      const next = handleEnter(state);
      if (next) { e.preventDefault(); apply(next); return; }
      return;
    }

    if (e.key === "Tab") {
      const next = handleTab(state, e.shiftKey);
      // Không có danh sách nào thì để Tab chuyển focus như bình thường.
      if (next) { e.preventDefault(); apply(next); }
      return;
    }

    if (e.key === "Backspace") {
      const next = handleBackspace(state);
      if (next) { e.preventDefault(); apply(next); }
    }
  }

  async function handleImageFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setError(null);

    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.error ?? "Ảnh không hợp lệ.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const el = areaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const alt = value.slice(start, end) || file.name.replace(/\.[^.]+$/, "");

    setUploading(true);
    try {
      const blob = await resizeImageToJpeg(file, MAX_DIMENSION);
      const path = `${folder}/${Date.now()}.jpg`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) {
        console.error("[MarkdownEditor] Upload ảnh lỗi:", uploadError);
        setError(
          uploadError.message.toLowerCase().includes("row-level security")
            ? "Bạn không có quyền tải ảnh lên."
            : "Không tải được ảnh lên. Vui lòng thử lại."
        );
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const snippet = `\n${buildImageMarkdown(alt, data.publicUrl, imgCaption, imgSize, imgAlign)}\n`;
      const caret = start + snippet.length;
      apply({ text: value.slice(0, start) + snippet + value.slice(end), start: caret, end: caret });

      setShowImageDialog(false);
      setImgCaption("");
    } catch (err) {
      console.error("[MarkdownEditor] Lỗi xử lý ảnh:", err);
      setError("Không xử lý được ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="md-editor">
      <div className="md-toolbar">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" className="md-toolbar__btn"
            title={t.title} aria-label={t.title} onClick={() => applyTool(t.id)}>
            {t.label}
          </button>
        ))}
        <button type="button" className="md-toolbar__btn"
          title="Chèn ảnh vào bài" aria-label="Chèn ảnh vào bài"
          onClick={() => setShowImageDialog((v) => !v)} disabled={uploading}>
          {uploading ? "…" : "🖼"}
        </button>

        <div className="md-toolbar__tabs">
          <button type="button"
            className={`md-toolbar__tab${mobileTab === "write" ? " is-active" : ""}`}
            onClick={() => setMobileTab("write")}>Soạn</button>
          <button type="button"
            className={`md-toolbar__tab${mobileTab === "preview" ? " is-active" : ""}`}
            onClick={() => setMobileTab("preview")}>Xem trước</button>
        </div>
      </div>

      {showImageDialog && (
        <div className="img-options">
          <p className="img-options__title">Chèn ảnh</p>
          <div className="img-options__row">
            <span className="img-options__label">Kích thước</span>
            <div className="seg">
              {IMAGE_SIZES.map((s) => (
                <button key={s} type="button"
                  className={`seg__btn${imgSize === s ? " is-active" : ""}`}
                  onClick={() => setImgSize(s)}>
                  {IMAGE_SIZE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="img-options__row">
            <span className="img-options__label">Căn lề</span>
            <div className="seg">
              {IMAGE_ALIGNS.map((a) => (
                <button key={a} type="button"
                  className={`seg__btn${imgAlign === a ? " is-active" : ""}`}
                  onClick={() => setImgAlign(a)}>
                  {IMAGE_ALIGN_LABEL[a]}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="img_caption">Chú thích (tuỳ chọn)</label>
            <input id="img_caption" value={imgCaption}
              onChange={(e) => setImgCaption(e.target.value)}
              placeholder="Hiện dưới ảnh, chữ nhỏ in nghiêng" />
          </div>
          <div className="img-options__actions">
            <button type="button" className="btn btn--solid btn--sm"
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Đang tải lên…" : "Chọn ảnh và chèn"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm"
              onClick={() => setShowImageDialog(false)}>Huỷ</button>
          </div>
          <p className="field__hint">Ảnh luôn co giãn theo màn hình; trên điện thoại mọi ảnh đều rộng hết khung.</p>
        </div>
      )}

      {selectedImage && !showImageDialog && (
        <div className="img-options img-options--inline">
          <p className="img-options__title">
            Ảnh đang chọn
            {selectedImage.caption && <span className="img-options__cap"> · {selectedImage.caption}</span>}
          </p>
          <div className="img-options__row">
            <span className="img-options__label">Kích thước</span>
            <div className="seg">
              {IMAGE_SIZES.map((s) => (
                <button key={s} type="button"
                  className={`seg__btn${selectedImage.size === s ? " is-active" : ""}`}
                  onClick={() => updateSelectedImage({ size: s })}>
                  {IMAGE_SIZE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="img-options__row">
            <span className="img-options__label">Căn lề</span>
            <div className="seg">
              {IMAGE_ALIGNS.map((a) => (
                <button key={a} type="button"
                  className={`seg__btn${selectedImage.align === a ? " is-active" : ""}`}
                  onClick={() => updateSelectedImage({ align: a })}>
                  {IMAGE_ALIGN_LABEL[a]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}

      <div className={`md-panes md-panes--${mobileTab}`}>
        <div className="md-pane md-pane--write">
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); setCursor(e.target.selectionStart); }}
            onKeyDown={handleKeyDown}
            onKeyUp={syncCursor}
            onClick={syncCursor}
            onSelect={syncCursor}
            placeholder={"Viết nội dung bằng markdown…\n\n## Tiêu đề mục\n\n- Gõ \"- \" rồi Enter để tiếp tục danh sách\n1. Gõ \"1. \" để đánh số tự động\n\n**Chữ đậm**, *chữ nghiêng*, [liên kết](https://...)"}
            spellCheck={false}
          />
        </div>

        <div className="md-pane md-pane--preview">
          {value.trim() ? (
            <PostContent content={value} />
          ) : (
            <p className="field__hint">Khung xem trước sẽ hiện ở đây khi bạn bắt đầu viết.</p>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={handleImageFile} hidden />
    </div>
  );
}
