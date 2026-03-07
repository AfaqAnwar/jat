import { Outlet, createRootRoute, useRouter } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function RootError({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={() => void router.navigate({ to: "/" })}
        className="border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Go home
      </button>
    </div>
  );
}

function NotFound() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-xl font-bold">Page not found</h1>
      <button
        onClick={() => void router.navigate({ to: "/" })}
        className="border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Go home
      </button>
    </div>
  );
}
