"use client";

import { useRef } from "react";

const HIGHLIGHT_COLORS = [
  { label: "노랑", value: "#fcefb4" },
  { label: "분홍", value: "#ffe3cf" },
  { label: "초록", value: "#d9f0e4" },
];

const FONTS = [
  { label: "기본체", value: "IBM Plex Sans, sans-serif" },
  { label: "명조체", value: "Georgia, serif" },
  { label: "고정폭", value: "IBM Plex Mono, monospace" },
];

const TABLE_HTML =
  '<table><tbody>' +
  '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'.repeat(3) +
  '</tbody></table><p><br></p>';

export default function RichTextEditor({ name, defaultValue }) {
  const editorRef = useRef(null);
  const hiddenRef = useRef(null);

  const sync = () => {
    if (editorRef.current && hiddenRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  };

  const exec = (command, value) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" onClick={() => exec("bold")} title="굵게">
          <b>B</b>
        </button>
        <button type="button" className="rte-btn" onClick={() => exec("italic")} title="기울임">
          <i>I</i>
        </button>
        <span className="rte-sep" />
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="rte-swatch"
            style={{ background: c.value }}
            title={`${c.label} 하이라이트`}
            onClick={() => exec("hiliteColor", c.value)}
          />
        ))}
        <button
          type="button"
          className="rte-btn"
          title="하이라이트 지우기"
          onClick={() => exec("hiliteColor", "transparent")}
        >
          지우기
        </button>
        <span className="rte-sep" />
        <select
          className="rte-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) exec("fontName", e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            폰트
          </option>
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="rte-sep" />
        <button
          type="button"
          className="rte-btn"
          title="표 삽입 (3x3)"
          onClick={() => exec("insertHTML", TABLE_HTML)}
        >
          표 삽입
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        dangerouslySetInnerHTML={{ __html: defaultValue || "" }}
      />
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue || ""} />
    </div>
  );
}
