import { AppLink as Link } from "@/components/ui/AppLink";

interface LogoProps {
  /** "dark" for dark backgrounds (white wordmark), "light" for light backgrounds (navy wordmark, white in dark mode). */
  tone?: "dark" | "light";
  className?: string;
}

/** The owner's GoQuicker logo: the G mark beside the wordmark. Built by scripts/prepare-logo.py. */
export function Logo({ tone = "dark", className = "" }: LogoProps) {
  const img = "h-10 w-auto sm:h-11";
  return (
    <Link href="/" aria-label="GoQuicker home" className={`inline-flex shrink-0 items-center ${className}`}>
      {tone === "light" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
          <img src="/images/brand/goquicker-lockup-light.webp" alt="" width={640} height={140} className={`${img} dark:hidden`} />
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
          <img src="/images/brand/goquicker-lockup-dark.webp" alt="" width={640} height={140} className={`${img} hidden dark:block`} />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- static logo
        <img src="/images/brand/goquicker-lockup-dark.webp" alt="" width={640} height={140} className={img} />
      )}
    </Link>
  );
}
