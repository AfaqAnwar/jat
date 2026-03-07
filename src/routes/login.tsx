import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { GithubLogoIcon, GoogleLogoIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Redirect } from "@/components/redirect";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden overscroll-none touch-none">
      <AuthLoading>
        <CircleNotchIcon size={24} weight="light" className="animate-spin text-muted-foreground" />
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

type Provider = "github" | "google";

function LoginView() {
  const { signIn } = useAuthActions();
  const [signingInWith, setSigningInWith] = useState<Provider | null>(null);

  const handleSignIn = async (provider: Provider) => {
    setSigningInWith(provider);
    try {
      await signIn(provider, { redirectTo: window.location.origin + import.meta.env.BASE_URL });
    } catch (err) {
      console.error("Sign-in failed:", err);
      setSigningInWith(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <img src={`${import.meta.env.BASE_URL}JAJT.png`} alt="JAT" className="h-24 w-24" />
      <div className="flex flex-col gap-2">
        <OAuthButton
          provider="github"
          label="GitHub"
          icon={<GithubLogoIcon size={12} weight="light" />}
          signingInWith={signingInWith}
          onSignIn={handleSignIn}
        />
        <OAuthButton
          provider="google"
          label="Google"
          icon={<GoogleLogoIcon size={12} weight="light" />}
          signingInWith={signingInWith}
          onSignIn={handleSignIn}
        />
      </div>
    </div>
  );
}

function OAuthButton({
  provider,
  label,
  icon,
  signingInWith,
  onSignIn,
}: {
  provider: Provider;
  label: string;
  icon: React.ReactNode;
  signingInWith: Provider | null;
  onSignIn: (provider: Provider) => void;
}) {
  const isLoading = signingInWith === provider;
  const isDisabled = signingInWith !== null;

  return (
    <button
      onClick={() => onSignIn(provider)}
      disabled={isDisabled}
      className="flex w-40 cursor-pointer items-center justify-center gap-1.5 border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <CircleNotchIcon size={12} weight="light" className="animate-spin" />
      ) : (
        icon
      )}
      {isLoading ? "Signing in..." : `${label} Login`}
    </button>
  );
}

