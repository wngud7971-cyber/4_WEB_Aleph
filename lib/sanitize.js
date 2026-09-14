import DOMPurify from "isomorphic-dompurify";

// 리치 텍스트(내용) 필드에서 허용하는 태그/속성만 남기고 나머지는 전부 제거한다.
// <script>, on클릭 같은 이벤트 속성, javascript: 링크 등은 여기서 걸러져
// 실행되지 않는다 (T06-C57: 스크립트 모양 글자는 그대로 텍스트로만 보여야 함).
const ALLOWED_TAGS = [
  "b", "strong", "i", "em", "u", "span", "mark", "br", "div", "p",
  "table", "thead", "tbody", "tr", "td", "th",
];
const ALLOWED_ATTR = ["style"];

export function sanitizeHtml(dirty) {
  if (!dirty) return "";
  return DOMPurify.sanitize(String(dirty), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // style 안에 url()이나 expression() 같은 걸로 우회하는 것도 막는다.
    ALLOWED_URI_REGEXP: /^$/,
  });
}
