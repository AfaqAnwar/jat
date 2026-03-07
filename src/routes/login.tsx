import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Redirect } from "@/components/redirect";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <AuthLoading>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AuthLoading>
      <Unauthenticated>
        <LoginView />
      </Unauthenticated>
      <Authenticated>
        <Redirect to="/" />
      </Authenticated>
    </div>
  );
}

function LoginView() {
  const { signIn } = useAuthActions();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn("github");
    } catch (err) {
      console.error("Sign-in failed:", err);
      setSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <img src="/JAJT.png" alt="JAT" className="h-24 w-24" />
      <button
        onClick={() => void handleSignIn()}
        disabled={signingIn}
        className="flex cursor-pointer items-center gap-1.5 border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <GithubLogoIcon size={12} weight="light" />
        {signingIn ? "Signing in..." : "GitHub Login"}
      </button>
    </div>
  );
}

