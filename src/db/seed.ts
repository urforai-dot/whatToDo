import { db } from "./client";
import { comments, taskOwners, tasks, users, type TaskStatus } from "./schema";

const PEOPLE = [
  "김민수",
  "박서연",
  "이준호",
  "정하늘",
  "최윤재",
  "한지우",
  "오세훈",
  "윤가람",
  "장도윤",
  "서예린",
];

type SeedTask = {
  title: string;
  model?: string;
  owners: string[];
  status: TaskStatus;
  priority: number;
  startDate?: string;
  dueDate?: string;
};

const SEED_TASKS: SeedTask[] = [
  { title: "긴급 결함 대응 #4471", model: "MX-2200", owners: ["박서연"], status: "in_progress", priority: 1, startDate: "2026-09-16", dueDate: "2026-09-18" },
  { title: "신규구조 분석", model: "MX-2200", owners: ["이준호", "정하늘"], status: "in_progress", priority: 1, startDate: "2026-09-08", dueDate: "2026-09-22" },
  { title: "SW 릴리즈 검증", model: "AX-410", owners: ["김민수"], status: "in_progress", priority: 1, startDate: "2026-09-14", dueDate: "2026-09-19" },
  { title: "양산 이관 문서 정리", model: "KV-90", owners: ["한지우"], status: "in_progress", priority: 2, startDate: "2026-09-01", dueDate: "2026-09-15" },
  { title: "펌웨어 빌드 자동화", owners: ["최윤재"], status: "hold", priority: 2, startDate: "2026-08-24", dueDate: "2026-09-11" },
  { title: "통신 모듈 규격 검토", model: "AX-410", owners: ["오세훈", "윤가람"], status: "planned", priority: 2, startDate: "2026-09-21", dueDate: "2026-10-02" },
  { title: "센서 드라이버 포팅", model: "MX-2200", owners: ["이준호"], status: "planned", priority: 2, startDate: "2026-09-25", dueDate: "2026-10-16" },
  { title: "정기 점검 리포트", model: "전 모델", owners: ["장도윤"], status: "in_progress", priority: 3, startDate: "2026-09-15", dueDate: "2026-09-30" },
  { title: "고객 요청 사양 반영", model: "KV-90", owners: ["서예린"], status: "planned", priority: 3, startDate: "2026-09-23", dueDate: "2026-10-09" },
  { title: "테스트 지그 개선", owners: [], status: "planned", priority: 3 },
  { title: "레거시 코드 정리", owners: ["정하늘"], status: "hold", priority: 4, startDate: "2026-07-20", dueDate: "2026-09-04" },
  { title: "8월 릴리즈 회고", owners: ["김민수"], status: "done", priority: 3, startDate: "2026-08-28", dueDate: "2026-09-05" },
];

const SEED_COMMENTS: { taskTitle: string; author: string; body: string; createdAt: string }[] = [
  { taskTitle: "신규구조 분석", author: "이준호", body: "신규구조 스펙 문서 1차 수령. 기존 대비 인터페이스 변경점 12건 확인.", createdAt: "2026-09-08T14:20:00+09:00" },
  { taskTitle: "신규구조 분석", author: "정하늘", body: "인터페이스 3건은 기존 드라이버 재사용 가능. 분석 범위를 9건으로 축소.", createdAt: "2026-09-11T09:05:00+09:00" },
  { taskTitle: "신규구조 분석", author: "이준호", body: "긴급 결함 대응 #4471 투입으로 이틀 지연. 완료예상일 09-22로 조정했습니다.", createdAt: "2026-09-15T17:40:00+09:00" },
  { taskTitle: "신규구조 분석", author: "정하늘", body: "전원 시퀀스 파트 리뷰는 박서연 님이 참여 가능. 목요일 오전으로 잡겠습니다.", createdAt: "2026-09-16T11:12:00+09:00" },
  { taskTitle: "8월 릴리즈 회고", author: "김민수", body: "회고 정리 공유 완료.", createdAt: "2026-09-05T16:00:00+09:00" },
];

async function seed() {
  console.log("Clearing existing data (idempotent reseed)...");
  await db.delete(comments);
  await db.delete(taskOwners);
  await db.delete(tasks);
  await db.delete(users);

  console.log("Seeding users...");
  const insertedUsers = await db
    .insert(users)
    .values(PEOPLE.map((name) => ({ name })))
    .returning();
  const userIdByName = new Map(insertedUsers.map((u) => [u.name, u.id]));

  console.log(`Seeding ${SEED_TASKS.length} tasks...`);
  const insertedTasks = await db
    .insert(tasks)
    .values(
      SEED_TASKS.map((t) => ({
        title: t.title,
        model: t.model,
        status: t.status,
        priority: t.priority,
        startDate: t.startDate,
        dueDate: t.dueDate,
      }))
    )
    .returning();
  const taskIdByTitle = new Map(insertedTasks.map((t) => [t.title, t.id]));

  console.log("Seeding task owners...");
  const ownerRows = SEED_TASKS.flatMap((t) =>
    t.owners.map((name) => ({
      taskId: taskIdByTitle.get(t.title)!,
      userId: userIdByName.get(name)!,
    }))
  );
  if (ownerRows.length > 0) await db.insert(taskOwners).values(ownerRows);

  console.log("Seeding comments...");
  await db.insert(comments).values(
    SEED_COMMENTS.map((c) => ({
      taskId: taskIdByTitle.get(c.taskTitle)!,
      authorId: userIdByName.get(c.author)!,
      body: c.body,
      createdAt: new Date(c.createdAt),
    }))
  );

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
