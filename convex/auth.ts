import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";

const ALLOWED_REDIRECT_ORIGINS = [
  siteUrl,
  "https://justanotherjobtracker.com",
  "https://www.justanotherjobtracker.com",
  "https://afaqanwar.github.io",
  "http://localhost:5173",
];

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google],
  callbacks: {
    async redirect({ redirectTo }) {
      const isAllowed = ALLOWED_REDIRECT_ORIGINS.some((origin) =>
        redirectTo.startsWith(origin),
      );
      if (isAllowed) return redirectTo;
      return siteUrl;
    },
  },
});
