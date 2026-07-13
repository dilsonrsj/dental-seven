import { describe, expect, it } from "vitest";
import {
  buildClinicLogoPath,
  extensionFromLogoMime,
  isPngImage,
} from "./clinic-logo";

describe("clinic-logo helpers", () => {
  it("buildClinicLogoPath usa clinic_id e extensão", () => {
    expect(buildClinicLogoPath("abc-123", "png")).toBe("abc-123/logo.png");
    expect(buildClinicLogoPath("abc-123", "jpg")).toBe("abc-123/logo.jpg");
  });

  it("extensionFromLogoMime aceita png e jpeg", () => {
    expect(extensionFromLogoMime("image/png")).toBe("png");
    expect(extensionFromLogoMime("image/jpeg")).toBe("jpg");
    expect(extensionFromLogoMime("image/webp")).toBeNull();
  });

  it("isPngImage detecta assinatura PNG", () => {
    expect(isPngImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(isPngImage(new Uint8Array([0xff, 0xd8, 0xff]))).toBe(false);
  });
});
