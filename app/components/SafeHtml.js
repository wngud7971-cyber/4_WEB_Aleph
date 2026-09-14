import { sanitizeHtml } from "@/lib/sanitize";

export default function SafeHtml({ html, className }) {
  const clean = sanitizeHtml(html);
  if (!clean || !clean.trim()) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
