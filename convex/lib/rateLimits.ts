import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  parseJob: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
  uploadResume: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },
  addJob: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },
  globalParse: { kind: "fixed window", rate: 500, period: HOUR },
});
