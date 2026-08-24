import { describe, expect, it } from "vitest";

import { QUERY_PATH } from "./api";
import { QUERY_STREAM_PATH } from "./stream";
import { COVERAGE_PATH } from "../coverage/api";

describe("API routing", () => {
  it("uses unversioned query endpoints", () => {
    expect(QUERY_PATH).toBe("/query");
    expect(QUERY_STREAM_PATH).toBe("/query/stream");
    expect(COVERAGE_PATH).toBe("/coverage");
    expect(
      [QUERY_PATH, QUERY_STREAM_PATH, COVERAGE_PATH].some((path) => path.startsWith("/v1/")),
    ).toBe(false);
  });
});
