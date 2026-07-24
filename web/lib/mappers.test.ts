import { describe, expect, it } from "vitest";
import {
  clientNameOf,
  latestJob,
  mapProject,
  type ProjectRow,
} from "@/lib/mappers";

describe("clientNameOf", () => {
  it("maneja null, objeto (to-one) y array", () => {
    expect(clientNameOf(null)).toBeNull();
    expect(clientNameOf({ name: "Canal X" })).toBe("Canal X");
    expect(clientNameOf([{ name: "Canal Y" }])).toBe("Canal Y");
    expect(clientNameOf([])).toBeNull();
  });
});

describe("latestJob", () => {
  it("elige el job más reciente por created_at", () => {
    const j = latestJob([
      { id: "1", state: "uploaded", progress: 0, created_at: "2026-01-01" },
      { id: "2", state: "rendering", progress: 55, created_at: "2026-02-01" },
    ]);
    expect(j.id).toBe("2");
    expect(j.state).toBe("rendering");
  });

  it("usa un default cuando no hay jobs", () => {
    expect(latestJob(null).state).toBe("uploaded");
    expect(latestJob([]).progress).toBe(0);
  });
});

describe("mapProject", () => {
  const row: ProjectRow = {
    id: "p1",
    workspace_id: "w1",
    client_id: "c1",
    title: "Video",
    description: "desc",
    created_at: "2026-07-22T10:00:00Z",
    clients: { name: "Canal X" },
    jobs: [{ id: "j1", state: "review_pending", progress: 40, created_at: "2026-07-22" }],
  };

  it("mapea snake_case → camelCase con cliente y job", () => {
    const p = mapProject(row);
    expect(p.workspaceId).toBe("w1");
    expect(p.clientId).toBe("c1");
    expect(p.clientName).toBe("Canal X");
    expect(p.createdAt).toBe("2026-07-22"); // recorta la parte de hora
    expect(p.job.state).toBe("review_pending");
    expect(p.job.progress).toBe(40);
  });

  it("tolera proyecto sin cliente ni jobs", () => {
    const p = mapProject({ ...row, clients: null, jobs: null, client_id: null });
    expect(p.clientName).toBeNull();
    expect(p.job.state).toBe("uploaded");
  });
});
