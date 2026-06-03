import Image from "next/image";

type Props = {
  showAtria?: boolean;
  compact?: boolean;
};

export function BrandHeader({ showAtria = true, compact = false }: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      <h1
        className={`font-bold tracking-wide text-[var(--brand-navy)] dark:text-[var(--brand-teal)] ${
          compact ? "text-xl" : "text-3xl sm:text-4xl"
        }`}
      >
        EXAM DESK
      </h1>
      {showAtria ? (
        <div className={`flex flex-col items-center gap-2 ${compact ? "mt-2" : "mt-4"}`}>
          <Image
            src="/atria-logo.png"
            alt="Atria Institute of Technology"
            width={compact ? 96 : 120}
            height={compact ? 64 : 80}
            className={`w-auto object-contain ${compact ? "h-12" : "h-14"}`}
          />
          <p className="text-xs font-medium tracking-wide text-[var(--brand-maroon)] dark:text-[var(--brand-maroon-light)]">
            Atria Institute of Technology
          </p>
        </div>
      ) : null}
    </div>
  );
}
