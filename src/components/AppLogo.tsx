import Image from "next/image";
import { APP_NAME } from "@/platform/brand";

type Props = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { box: 28, text: "text-base" },
  md: { box: 32, text: "text-xl" },
  lg: { box: 48, text: "text-3xl" },
};

export function AppLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: Props) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/brand/dent-logo.png"
        alt=""
        width={s.box}
        height={s.box}
        className="shrink-0 rounded-[10px]"
        priority
      />
      {showWordmark ? (
        <span className={`font-semibold text-gray-900 ${s.text}`}>
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}
