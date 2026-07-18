import Image from "next/image";

/**
 * Hero visual. Uses a pre-composed dashboard image (public/hero-dashboard.png)
 * — the exported panel + floating cards — instead of the hand-built HTML mock.
 * Replace the PNG to update the hero; keep the file name stable.
 */
export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-190 lg:translate-x-2 xl:translate-x-0">
      {/* soft glow behind the panel (shows through if the PNG has transparency) */}
      <div className="pointer-events-none absolute inset-8 -z-10 rounded-full bg-fruition-200/40 blur-3xl" />
      <Image
        src="/hero-dashboard.png"
        alt="FruitionHR dashboard showing payroll overview, compliance status, leave approvals and team insights"
        width={1160}
        height={922}
        priority
        sizes="(min-width: 1024px) 55vw, 100vw"
        className="relative h-auto w-full"
      />
    </div>
  );
}
