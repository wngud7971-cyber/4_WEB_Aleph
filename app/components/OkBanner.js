const MESSAGES = {
  "plan-created": "계획이 저장되었습니다.",
  "plan-updated": "계획이 수정되었습니다.",
  "plan-deleted": "계획이 삭제되었습니다.",
  "todo-created": "할 일이 추가되었습니다.",
  "todo-updated": "할 일이 수정되었습니다.",
  "todo-deleted": "할 일이 삭제되었습니다.",
  "todo-done": "완료로 표시했습니다.",
  "todo-undone": "진행 중으로 되돌렸습니다.",
  "log-created": "실행 기록이 저장되었습니다.",
  "insight-created": "다음 계획으로 넘겼습니다.",
  "memo-created": "메모가 저장되었습니다.",
  "memo-deleted": "메모가 삭제되었습니다.",
};

export default function OkBanner({ ok }) {
  if (!ok || !MESSAGES[ok]) return null;
  return <div className="ok-banner">✓ {MESSAGES[ok]}</div>;
}
