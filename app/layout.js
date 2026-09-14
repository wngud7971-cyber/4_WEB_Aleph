import "./globals.css";

export const metadata = {
  title: "플랜두씨 다이어리",
  description: "계획(Plan) → 실제로 한 일(Do) → 돌아보기(See)를 잇는 다이어리",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <a href="/" className="brand">
              플랜두씨 다이어리
            </a>
            <nav className="nav">
              <a href="/plans">계획</a>
              <a href="/todos">할 일</a>
              <a href="/execution/new">실행 기록</a>
              <a href="/review">돌아보기</a>
              <a href="/api/export">내보내기</a>
            </nav>
            <div className="notice-banner">
              지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이
              봐도 괜찮은 내용만 넣으세요
            </div>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
