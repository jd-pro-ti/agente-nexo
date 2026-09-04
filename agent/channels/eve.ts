import { timingSafeEqual } from "node:crypto";
import { eveChannel } from "eve/channels/eve";
import {
  extractBearerToken,
  type AuthFn,
  withAuthChallenges,
} from "eve/channels/auth";

const tokenAuth: AuthFn<Request> = withAuthChallenges(
  (request) => {
    const expectedToken = process.env.EVE_AUTH_TOKEN;
    const providedToken = extractBearerToken(
      request.headers.get("authorization"),
    );

    if (!expectedToken || !providedToken) return null;

    const expected = Buffer.from(expectedToken, "utf8");
    const provided = Buffer.from(providedToken, "utf8");
    const isValid =
      expected.length === provided.length && timingSafeEqual(expected, provided);

    if (!isValid) return null;

    return {
      attributes: {},
      authenticator: "static-bearer-token",
      principalId: "token-client",
      principalType: "service",
    };
  },
  [{ scheme: "Bearer" }],
);

export default eveChannel({
  auth: tokenAuth,
});
