import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Tailwind height class, e.g. h-8 */
  heightClass?: string;
};

export function SiteLogo({ className, heightClass = "h-8" }: Props) {
  return (
    <img
      src="/images/logo-transparent.png"
      alt="Your Impact Foundation"
      className={cn(
        heightClass,
        "w-auto max-w-[8.5rem] sm:max-w-[9.5rem] object-contain object-left shrink-0 select-none",
        className
      )}
      draggable={false}
      width={160}
      height={65}
    />
  );
}
