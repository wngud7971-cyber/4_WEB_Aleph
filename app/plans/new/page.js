import { createPlan } from "@/app/actions";

export default function NewPlanPage() {
  return (
    <section className="panel">
      <h1>계획 세우기</h1>
      <p className="sub">
        지금 실제로 하고 있는 일(운동·공부·업무·게임 연습·ALEPH 진행 등) 가운데 하나를
        골라 내 계획을 넣으세요.
      </p>
      <form action={createPlan}>
        <label>
          제목
          <input name="title" required placeholder="예: ALEPH 6번 과제 완주" />
        </label>
        <div className="row2">
          <label>
            시작일
            <input type="date" name="periodStart" required />
          </label>
          <label>
            종료일
            <input type="date" name="periodEnd" required />
          </label>
        </div>
        <label>
          우선순위
          <select name="priority" defaultValue="보통">
            <option value="최우선">최우선</option>
                  <option value="높음">높음</option>
            <option value="보통">보통</option>
            <option value="낮음">낮음</option>
          </select>
        </label>
        <label>
          성공 기준
          <textarea
            name="successCriteria"
            required
            placeholder="예: 통과 기준을 모두 충족하고 배포까지 마친다"
          />
        </label>
        <label>
          예상 시간(시간 단위)
          <input type="number" step="0.5" min="0" name="estimatedHours" required />
        </label>
        <button type="submit">계획 저장</button>
      </form>
    </section>
  );
}
