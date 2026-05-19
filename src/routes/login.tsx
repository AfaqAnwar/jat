import { useAuthActions } from "@convex-dev/auth/react";
import {
  CircleNotchIcon,
  GithubLogoIcon,
  GoogleLogoIcon,
  ListChecksIcon,
  NotePencilIcon,
  RowsIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Redirect } from "@/components/redirect";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none bg-background">
      <AuthLoading>
        <div className="flex h-full items-center justify-center">
          <CircleNotchIcon
            size={24}
            weight="light"
            className="animate-spin text-muted-foreground"
          />
        </div>
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
      await signIn(provider, {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      });
    } catch (err) {
      console.error("Sign-in failed:", err);
      setSigningInWith(null);
    }
  };

  return <LoginLanding signingInWith={signingInWith} onSignIn={handleSignIn} />;
}

function LoginLanding({
  signingInWith,
  onSignIn,
}: {
  signingInWith: Provider | null;
  onSignIn: (provider: Provider) => void;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <MobileHeader signingInWith={signingInWith} onSignIn={onSignIn} />
      <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
            Applications, resumes, next steps.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            A small workspace for keeping a personal job search readable.
          </p>
          <CapabilityGrid />
        </div>
        <div className="hidden self-center lg:block">
          <SignInPanel signingInWith={signingInWith} onSignIn={onSignIn} />
        </div>
      </section>
    </main>
  );
}

function MobileHeader({
  signingInWith,
  onSignIn,
}: {
  signingInWith: Provider | null;
  onSignIn: (provider: Provider) => void;
}) {
  return (
    <header className="flex items-center justify-between lg:hidden">
      <img
        src={`${import.meta.env.BASE_URL}JAJT.png`}
        alt="JAT"
        className="h-9 w-9"
      />
      <Drawer direction="bottom">
        <DrawerTrigger asChild>
          <button
            type="button"
            className="flex h-8 cursor-pointer items-center px-2 text-sm font-bold text-foreground"
          >
            Login
          </button>
        </DrawerTrigger>
        <DrawerContent className="px-4 pt-5 pb-4 [&>div:first-child]:hidden">
          <DrawerTitle className="sr-only">Sign in</DrawerTitle>
          <SignInPanel
            signingInWith={signingInWith}
            onSignIn={onSignIn}
            variant="sheet"
          />
        </DrawerContent>
      </Drawer>
    </header>
  );
}

function SignInPanel({
  signingInWith,
  onSignIn,
  variant = "panel",
}: {
  signingInWith: Provider | null;
  onSignIn: (provider: Provider) => void;
  variant?: "panel" | "sheet";
}) {
  return (
    <div
      className={
        variant === "sheet"
          ? "w-full bg-background pt-2"
          : "w-full border border-border bg-background p-4 sm:p-5"
      }
    >
      <div className="mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">Open workspace</h2>
            <span className="border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Free
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sign in to continue.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <OAuthButton
          provider="github"
          label="GitHub"
          icon={<GithubLogoIcon size={13} weight="light" />}
          signingInWith={signingInWith}
          onSignIn={onSignIn}
        />
        <OAuthButton
          provider="google"
          label="Google"
          icon={<GoogleLogoIcon size={13} weight="light" />}
          signingInWith={signingInWith}
          onSignIn={onSignIn}
        />
      </div>
      <p className="mt-4 border-t border-border pt-3 text-[10px] leading-4 text-muted-foreground">
        Private by default to your account. No marketing surface, no extra
        onboarding flow.
      </p>
    </div>
  );
}

function CapabilityGrid() {
  return (
    <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
      <Capability
        icon={<NotePencilIcon size={16} weight="light" />}
        title="URL"
        detail="Save roles as they appear."
      />
      <Capability
        icon={<RowsIcon size={16} weight="light" />}
        title="Resume"
        detail="Keep variants close at hand."
      />
      <Capability
        icon={<ListChecksIcon size={16} weight="light" />}
        title="Status"
        detail="Track what needs attention."
      />
    </div>
  );
}

function Capability({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="border border-border p-3">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <div className="text-xs font-bold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
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
      type="button"
      onClick={() => onSignIn(provider)}
      disabled={isDisabled}
      className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 border border-border px-2 text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
