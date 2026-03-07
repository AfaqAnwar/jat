import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [breakpoint])
  return mobile
}

const Toaster = ({ ...props }: ToasterProps) => {
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      closeButton
      icons={{
        success: (
          <CheckCircleIcon className="size-4" weight="light" />
        ),
        info: (
          <InfoIcon className="size-4" weight="light" />
        ),
        warning: (
          <WarningIcon className="size-4" weight="light" />
        ),
        error: (
          <XCircleIcon className="size-4" weight="light" />
        ),
        loading: (
          <SpinnerIcon className="size-4 animate-spin" weight="light" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
