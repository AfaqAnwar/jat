import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { JobTable } from "@/components/job-table";
import { AddJobBar } from "@/components/add-job-bar";
import { ResumeManager } from "@/components/resume-manager";
import { StatePicker } from "@/components/state-picker";
import { MobileAddButton } from "@/components/mobile-add-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Redirect } from "@/components/redirect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAddJob } from "@/lib/use-add-job";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <>
      <AuthLoading>
        <DashboardSkeleton />
      </AuthLoading>
      <Unauthenticated>
        <Redirect to="/login" />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}

function Dashboard() {
  const { signOut } = useAuthActions();
  const jobs = useQuery(api.jobs.list);
  const resumes = useQuery(api.resumes.list);
  const addJob = useAddJob();
  const [resumesOpen, setResumesOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:flex sm:h-screen sm:flex-col sm:overflow-hidden">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/JAJT.png" alt="JAT" className="h-8 w-8 sm:h-9 sm:w-9" />
          <h1 className="text-xl font-bold sm:text-2xl">Just Another Job Tracker</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="cursor-pointer rounded-none p-1 text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="User menu"
            >
              <UserIcon size={24} weight="light" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none">
            <DropdownMenuItem onClick={() => setResumesOpen(true)}>
              Manage Resumes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStateOpen(true)}>
              Your Location
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSignOutOpen(true)}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="mb-6">
        <AddJobBar addJob={addJob} />
      </div>

      <div className="sm:min-h-0 sm:flex-1">
        {jobs === undefined ? (
          <TableSkeleton />
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <p className="text-center font-light text-muted-foreground">
              No job applications yet.
              <br />
              <span className="hidden sm:inline">Paste a URL above to get started.</span>
              <span className="sm:hidden">Tap Add Job below to get started.</span>
            </p>
          </div>
        ) : (
          <JobTable jobs={jobs} resumes={resumes ?? []} />
        )}
      </div>

      <ResumeManager open={resumesOpen} onOpenChange={setResumesOpen} />
      <StatePicker open={stateOpen} onOpenChange={setStateOpen} />

      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="rounded-none sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSignOutOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileAddButton addJob={addJob} />
    </div>

    <footer className="fixed bottom-2 right-4 z-40 hidden sm:block">
      <span className="text-[10px] text-muted-foreground/15">
        Developed by{" "}
        <a
          href="https://afaqanw.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/40"
        >
          Afaq Anwar
        </a>
      </span>
    </footer>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:flex sm:h-screen sm:flex-col sm:overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mb-6 h-10 w-full" />
      <div className="sm:min-h-0 sm:flex-1">
        <TableSkeleton />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

