export function normalizeUrl(raw: string): string | null {
  let url = raw.trim();
  if (!url) return null;

  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("linkedin.com")) {
      const jobId =
        parsed.searchParams.get("currentJobId") ??
        parsed.pathname.match(/\/jobs\/view\/(\d+)/)?.[1];
      if (jobId) {
        return `https://www.linkedin.com/jobs/view/${jobId}`;
      }
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}
