import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { useEffect } from "react";

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
        <RedirectToDashboard />
      </Authenticated>
    </div>
  );
}

function LoginView() {
  const { signIn } = useAuthActions();
  return (
    <div className="flex flex-col items-center gap-8">
      <img src="/JAJT.png" alt="JAT" className="h-24 w-24" />
      <button
        onClick={() => void signIn("github")}
        className="flex cursor-pointer items-center gap-1.5 border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
      >
        <GithubLogoIcon size={12} weight="light" />
        GitHub Login
      </button>
    </div>
  );
}

function RedirectToDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/" });
  }, [navigate]);
  return null;
}
