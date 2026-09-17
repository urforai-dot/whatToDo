import { db } from "./client";
import { comments, taskOwners, tasks, users } from "./schema";

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

async function seed() {
  console.log("Seeding users...");
  const insertedUsers = await db
    .insert(users)
    .values(PEOPLE.map((name) => ({ name })))
    .returning();
  const byName = new Map(insertedUsers.map((u) => [u.name, u.id]));

  console.log("Seeding tasks...");
  const [urgentBug, structureAnalysis, releaseCheck] = await db
    .insert(tasks)
    .values([
      {
        title: "긴급 결함 대응 #4471",
        model: "MX-2200",
        status: "in_progress",
        priority: 1,
        startDate: "2026-09-16",
        dueDate: "2026-09-18",
      },
      {
        title: "신규구조 분석",
        model: "MX-2200",
        status: "in_progress",
        priority: 1,
        startDate: "2026-09-08",
        dueDate: "2026-09-22",
      },
      {
        title: "SW 릴리즈 검증",
        model: "AX-410",
        status: "in_progress",
        priority: 1,
        startDate: "2026-09-14",
        dueDate: "2026-09-19",
      },
    ])
    .returning();

  await db.insert(taskOwners).values([
    { taskId: urgentBug.id, userId: byName.get("박서연")! },
    { taskId: structureAnalysis.id, userId: byName.get("이준호")! },
    { taskId: structureAnalysis.id, userId: byName.get("정하늘")! },
    { taskId: releaseCheck.id, userId: byName.get("김민수")! },
  ]);

  console.log("Seeding comments...");
  await db.insert(comments).values([
    {
      taskId: structureAnalysis.id,
      authorId: byName.get("이준호")!,
      body: "신규구조 스펙 문서 1차 수령. 기존 대비 인터페이스 변경점 12건 확인.",
    },
    {
      taskId: structureAnalysis.id,
      authorId: byName.get("정하늘")!,
      body: "인터페이스 3건은 기존 드라이버 재사용 가능. 분석 범위를 9건으로 축소.",
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
