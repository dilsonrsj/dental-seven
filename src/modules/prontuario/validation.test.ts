import { describe, expect, it } from "vitest";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  assertAllowedUpload,
  isAllowedMimeType,
} from "./validation";

describe("isAllowedMimeType", () => {
  it("accepts pdf, jpeg and png", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(true);
    expect(isAllowedMimeType("image/jpeg")).toBe(true);
    expect(isAllowedMimeType("image/png")).toBe(true);
  });

  it("rejects other types", () => {
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
    expect(isAllowedMimeType("text/plain")).toBe(false);
  });
});

describe("assertAllowedUpload", () => {
  it("accepts valid pdf within size limit", () => {
    expect(() =>
      assertAllowedUpload({ type: "application/pdf", size: 1024 }),
    ).not.toThrow();
  });

  it("rejects disallowed mime type", () => {
    expect(() =>
      assertAllowedUpload({
        type: "application/x-msdownload",
        size: 1024,
      }),
    ).toThrow(/PDF, JPG ou PNG/i);
  });

  it("rejects files over 10 MB", () => {
    expect(() =>
      assertAllowedUpload({
        type: "application/pdf",
        size: MAX_FILE_BYTES + 1,
      }),
    ).toThrow(/10 MB/i);
  });

  it("rejects empty files", () => {
    expect(() =>
      assertAllowedUpload({ type: "image/png", size: 0 }),
    ).toThrow(/vazio/i);
  });
});

describe("constants", () => {
  it("exports three allowed mime types", () => {
    expect(ALLOWED_MIME_TYPES).toHaveLength(3);
  });

  it("max size is 10 MB", () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });
});
