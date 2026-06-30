import { beforeEach, describe, expect, it } from "vitest";
import { demoStore, resetDemoStore } from "./store";

describe("demoStore", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("loads fictitious patients from bundled JSON seed", () => {
    const patients = demoStore.getPatients();
    expect(patients.length).toBe(8);
    expect(patients[0]?.name).toBeTruthy();
    expect(patients.some((p) => p.name === "Marina Costa")).toBe(true);
  });

  it("loads whatsapp threads with patient relation", () => {
    const threads = demoStore.getThreads();
    expect(threads.length).toBe(4);
    expect(threads[0]?.patient?.name).toBeTruthy();
  });

  it("filters patients by search term", () => {
    const patients = demoStore.getPatients("marina");
    expect(patients).toHaveLength(1);
    expect(patients[0]?.name).toBe("Marina Costa");
  });
});
