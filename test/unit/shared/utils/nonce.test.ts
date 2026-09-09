import { describe, it, expect } from "vitest";
import { getNonce } from "../../../../src/shared/utils/nonce";

describe("scaffold", () => {
  it("should generate nonce with 32 characters", () => {
    const nonce = getNonce();
    expect(nonce).toHaveLength(32);
    expect(nonce).toMatch(/^[A-Za-z0-9]+$/);
  });
});
