import Image from "next/image";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-64 place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/fruitionhr-logo-loader.gif"
          width={96}
          height={96}
          alt=""
          unoptimized
          priority
          className="size-20 motion-reduce:hidden"
        />
        <Image
          src="/fruitionhr-logo-icon.svg"
          width={80}
          height={80}
          alt=""
          className="hidden size-20 motion-reduce:block"
        />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
