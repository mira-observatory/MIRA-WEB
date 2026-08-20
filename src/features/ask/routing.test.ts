import { describe, expect, it } from "vitest";

import { QUERY_PATH } from "./api";
import { QUERY_STREAM_PATH } from "./stream";

describe("API routing", () => {
  it("uses unversioned query endpoints", () => {
    expect(QUERY_PATH).toBe("/query");
    expect(QUERY_STREAM_PATH).toBe("/query/stream");
    expect([QUERY_PATH, QUERY_STREAM_PATH].some((path) => path.startsWith("/v1/"))).toBe(false);
  });
});
