"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import { resizeImageToJpeg, validateImageFile } from "@/lib/imageUpload";

const MAX_DIMENSION = 1600;

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Thư mục trong bucket media cho ảnh chèn giữa bài. */
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

export default function MarkdownEditor({ value, onChange, folder }: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Thay đoạn đang chọn rồi đặt lại con trỏ. */
  function replaceSelection(build: (selected: string) => { text: string; cursor?: number }) {
    const el = areaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const { text, cursor } = build(selected);

    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + (cursor ?? text.length);
      el.setSelectionRange(pos, pos);
    });
  }

  /** Thêm tiền tố vào đầu mỗi dòng đang chọn. */
  function prefixLines(prefix: string | ((i: number) => string)) {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, sliceEnd) || "";

    const updated = block
      .split("\n")
      .map((line, i) => {
        const p = typeof prefix === "string" ? prefix : prefix(i);
        return line.startsWith(p) ? line.slice(p.length) : p + line;
      })
      .join("\n");

    const next = value.slice(0, lineStart) + updated + value.slice(sliceEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + updated.length);
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
      case "heading":
        return prefixLines("## ");
      case "ul":
        return prefixLines("- ");
      case "ol":
        return prefixLines((i) => `${i + 1}. `);
      case "quote":
        return prefixLines("> ");
      case "link":
        return replaceSelection((s) => ({
          text: `[${s || "nội dung liên kết"}](https://)`,
          cursor: s ? s.length + 3 : 1,
        }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b") { e.preventDefault(); applyTool("bold"); }
    if (key === "i") { e.preventDefault(); applyTool("italic"); }
  }

  /** Upload ảnh rồi chèn cú pháp markdown ngay tại vị trí con trỏ. */
  async function handleImage(ev: React.ChangeEvent<HTMLInputElement>) {
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
      const snippet = `\n![${alt}](${data.publicUrl})\n`;
      const next = value.slice(0, start) + snippet + value.slice(end);
      onChange(next);

      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + snippet.length;
        el?.setSelectionRange(pos, pos);
      });
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
          <button
            key={t.id}
            type="button"
            className="md-toolbar__btn"
            title={t.title}
            aria-label={t.title}
            onClick={() => applyTool(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          className="md-toolbar__btn"
          title="Chèn ảnh vào bài"
          aria-label="Chèn ảnh vào bài"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "…" : "🖼"}
        </button>

        <div className="md-toolbar__tabs">
          <button
            type="button"
            className={`md-toolbar__tab${mobileTab === "write" ? " is-active" : ""}`}
            onClick={() => setMobileTab("write")}
          >
            Soạn
          </button>
          <button
            type="button"
            className={`md-toolbar__tab${mobileTab === "preview" ? " is-active" : ""}`}
            onClick={() => setMobileTab("preview")}
          >
            Xem trước
          </button>
        </div>
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <div className={`md-panes md-panes--${mobileTab}`}>
        <div className="md-pane md-pane--write">
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Viết nội dung bằng markdown…\n\n## Tiêu đề mục\n\n- Ý thứ nhất\n- Ý thứ hai\n\n**Chữ đậm**, *chữ nghiêng*, [liên kết](https://...)"}
            spellCheck={false}
          />
        </div>

        <div className="md-pane md-pane--preview">
          {value.trim() ? (
            <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
          ) : (
            <p className="field__hint">Khung xem trước sẽ hiện ở đây khi bạn bắt đầu viết.</p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImage}
        hidden
      />
    </div>
  );
}
