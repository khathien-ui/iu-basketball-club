/**
 * Hành vi danh sách tự động trong ô soạn markdown — giống Word / Google Docs.
 * Toàn bộ là hàm thuần trên (text, vị trí con trỏ) nên kiểm thử được độc lập
 * với React và DOM.
 */

export interface EditorState {
  text: string;
  start: number;
  end: number;
}

export type LineKind = "ul" | "ol" | "quote" | null;

export interface LineInfo {
  indent: string;
  /** "-", "*", "+", "1.", "1)", ">" — null nếu dòng thường. */
  marker: string | null;
  kind: LineKind;
  /** Số thứ tự với danh sách đánh số. */
  number: number | null;
  /** Phần nội dung sau ký hiệu. */
  content: string;
  /** Độ dài phần "indent + marker + khoảng trắng". */
  prefixLength: number;
}

const INDENT = "  "; // hai khoảng trắng cho mỗi cấp

export function parseLine(line: string): LineInfo {
  const ol = line.match(/^(\s*)(\d+)([.)])(\s+)(.*)$/);
  if (ol) {
    return {
      indent: ol[1],
      marker: ol[2] + ol[3],
      kind: "ol",
      number: Number(ol[2]),
      content: ol[5],
      prefixLength: ol[1].length + ol[2].length + 1 + ol[4].length,
    };
  }

  const ul = line.match(/^(\s*)([-*+])(\s+)(.*)$/);
  if (ul) {
    return {
      indent: ul[1],
      marker: ul[2],
      kind: "ul",
      number: null,
      content: ul[4],
      prefixLength: ul[1].length + 1 + ul[3].length,
    };
  }

  const quote = line.match(/^(\s*)(>+)(\s?)(.*)$/);
  if (quote) {
    return {
      indent: quote[1],
      marker: quote[2],
      kind: "quote",
      number: null,
      content: quote[4],
      prefixLength: quote[1].length + quote[2].length + quote[3].length,
    };
  }

  return { indent: "", marker: null, kind: null, number: null, content: line, prefixLength: 0 };
}

export function lineBounds(text: string, pos: number): { start: number; end: number } {
  const start = text.lastIndexOf("\n", pos - 1) + 1;
  const nl = text.indexOf("\n", pos);
  return { start, end: nl === -1 ? text.length : nl };
}

/** Con trỏ có đang nằm trong khối mã ``` không. */
export function insideCodeFence(text: string, pos: number): boolean {
  const before = text.slice(0, pos);
  const fences = before.match(/^```/gm);
  return !!fences && fences.length % 2 === 1;
}

/**
 * Đánh số lại toàn bộ danh sách có số cho đúng thứ tự.
 * Mỗi cấp thụt đầu dòng đếm riêng; dòng trống kết thúc danh sách.
 */
export function renumberOrderedLists(text: string): string {
  const counters = new Map<number, number>();
  let inFence = false;

  return text
    .split("\n")
    .map((line) => {
      if (/^```/.test(line)) { inFence = !inFence; return line; }
      if (inFence) return line;

      const info = parseLine(line);

      if (!info.kind) {
        if (!line.trim()) counters.clear();
        return line;
      }
      if (info.kind !== "ol") {
        counters.delete(info.indent.length);
        return line;
      }

      const width = info.indent.length;
      // Bước sang danh sách con thì các cấp sâu hơn đếm lại từ đầu.
      for (const key of Array.from(counters.keys())) {
        if (key > width) counters.delete(key);
      }

      const next = (counters.get(width) ?? 0) + 1;
      counters.set(width, next);

      const delim = info.marker!.endsWith(")") ? ")" : ".";
      return `${info.indent}${next}${delim} ${info.content}`;
    })
    .join("\n");
}

/** Vị trí tuyệt đối -> (dòng, cột). */
function posToLineCol(text: string, pos: number): { line: number; col: number } {
  const before = text.slice(0, pos);
  const line = before.split("\n").length - 1;
  const col = pos - (before.lastIndexOf("\n") + 1);
  return { line, col };
}

/** (dòng, cột) -> vị trí tuyệt đối, kẹp trong độ dài dòng. */
function lineColToPos(text: string, line: number, col: number): number {
  const lines = text.split("\n");
  let pos = 0;
  for (let i = 0; i < line && i < lines.length; i++) pos += lines[i].length + 1;
  const len = lines[Math.min(line, lines.length - 1)]?.length ?? 0;
  return pos + Math.min(col, len);
}

/** Đánh số lại rồi giữ con trỏ đúng dòng/cột cũ. */
function renumberKeepingCursor(state: EditorState): EditorState {
  const { line, col } = posToLineCol(state.text, state.start);
  const { line: eLine, col: eCol } = posToLineCol(state.text, state.end);
  const text = renumberOrderedLists(state.text);
  return {
    text,
    start: lineColToPos(text, line, col),
    end: lineColToPos(text, eLine, eCol),
  };
}

/**
 * Enter trong danh sách / trích dẫn.
 * Trả null nếu không cần can thiệp (để textarea xử lý mặc định).
 */
export function handleEnter(state: EditorState): EditorState | null {
  const { text, start, end } = state;
  if (start !== end) return null;
  if (insideCodeFence(text, start)) return null;

  const { start: ls, end: le } = lineBounds(text, start);
  const line = text.slice(ls, le);
  const info = parseLine(line);
  if (!info.kind) return null;

  // Con trỏ phải nằm sau ký hiệu thì mới coi là đang ở trong mục danh sách.
  if (start < ls + info.prefixLength) return null;

  // Mục rỗng: thoát danh sách (thụt ra một cấp, hết cấp thì xoá hẳn ký hiệu).
  if (!info.content.trim()) {
    if (info.indent.length >= INDENT.length) {
      const outdented = info.indent.slice(INDENT.length) +
        (info.kind === "ol" ? "1. " : info.kind === "ul" ? `${info.marker} ` : `${info.marker} `);
      const next = text.slice(0, ls) + outdented + text.slice(le);
      return renumberKeepingCursor({
        text: next,
        start: ls + outdented.length,
        end: ls + outdented.length,
      });
    }
    const next = text.slice(0, ls) + text.slice(le);
    return { text: next, start: ls, end: ls };
  }

  // Mục có nội dung: xuống dòng và thêm ký hiệu mới.
  let marker: string;
  if (info.kind === "ol") {
    const delim = info.marker!.endsWith(")") ? ")" : ".";
    marker = `${(info.number ?? 1) + 1}${delim} `;
  } else if (info.kind === "ul") {
    marker = `${info.marker} `;
  } else {
    marker = `${info.marker} `;
  }

  const insert = `\n${info.indent}${marker}`;
  const next = text.slice(0, start) + insert + text.slice(start);
  const caret = start + insert.length;

  return renumberKeepingCursor({ text: next, start: caret, end: caret });
}

/** Tab / Shift+Tab: thụt vào hoặc thụt ra các dòng đang chọn. */
export function handleTab(state: EditorState, shift: boolean): EditorState | null {
  const { text, start, end } = state;

  // Trong khối mã: Tab chèn khoảng trắng, Shift+Tab bỏ qua.
  if (insideCodeFence(text, start)) {
    if (shift || start !== end) return null;
    const next = text.slice(0, start) + INDENT + text.slice(end);
    return { text: next, start: start + INDENT.length, end: start + INDENT.length };
  }

  const first = lineBounds(text, start);
  const last = lineBounds(text, end);
  const block = text.slice(first.start, last.end);
  const lines = block.split("\n");

  // Chỉ can thiệp khi có ít nhất một dòng là danh sách / trích dẫn,
  // để Tab vẫn chuyển focus được như bình thường ở ô soạn văn xuôi.
  if (!lines.some((l) => parseLine(l).kind)) return null;

  const updated = lines.map((line) => {
    const info = parseLine(line);
    if (!info.kind) return line;
    if (shift) {
      return info.indent.length >= INDENT.length ? line.slice(INDENT.length) : line;
    }
    return INDENT + line;
  });

  const nextBlock = updated.join("\n");
  const delta = nextBlock.length - block.length;
  const text2 = text.slice(0, first.start) + nextBlock + text.slice(last.end);

  const firstLineDelta = updated[0].length - lines[0].length;
  return renumberKeepingCursor({
    text: text2,
    start: Math.max(first.start, start + firstLineDelta),
    end: Math.max(first.start, end + delta),
  });
}

/** Backspace ngay sau ký hiệu danh sách: bỏ ký hiệu, giữ nội dung. */
export function handleBackspace(state: EditorState): EditorState | null {
  const { text, start, end } = state;
  if (start !== end) return null;
  if (insideCodeFence(text, start)) return null;

  const { start: ls, end: le } = lineBounds(text, start);
  const line = text.slice(ls, le);
  const info = parseLine(line);
  if (!info.kind) return null;
  if (start !== ls + info.prefixLength) return null;

  const next = text.slice(0, ls) + info.content + text.slice(le);
  return renumberKeepingCursor({ text: next, start: ls, end: ls });
}

/**
 * Gõ "```" rồi Enter ở dòng trống: tự đóng khối mã.
 * Trả null nếu không áp dụng.
 */
export function handleCodeFenceEnter(state: EditorState): EditorState | null {
  const { text, start, end } = state;
  if (start !== end) return null;

  const { start: ls, end: le } = lineBounds(text, start);
  const line = text.slice(ls, le);
  if (!/^```[a-zA-Z0-9]*$/.test(line.trim())) return null;
  if (insideCodeFence(text, ls)) return null; // đang đóng khối, không thêm nữa

  const insert = "\n\n```";
  const next = text.slice(0, le) + insert + text.slice(le);
  const caret = le + 1;
  return { text: next, start: caret, end: caret };
}
