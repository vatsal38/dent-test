import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "warning" | "danger";

function classesForVariant(variant: Variant): string {
  switch (variant) {
    case "primary":
      return "bg-orange-500 text-white hover:bg-orange-600 border-orange-500";
    case "warning":
      return "bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300";
    case "danger":
      return "bg-red-600 text-white hover:bg-red-700 border-red-600";
    case "secondary":
      return "bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-300";
    case "outline":
    default:
      return "bg-white text-gray-700 hover:bg-gray-50 border-gray-300";
  }
}

const base =
  "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export function BobActionButton(props: {
  label: string;
  icon?: ReactNode;
  variant?: Variant;
  href?: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const {
    label,
    icon,
    href,
    onClick,
    disabled,
    title,
    className,
    type = "button",
    variant = "outline",
  } = props;

  const cn = `${base} ${classesForVariant(variant)} ${className ?? ""}`.trim();

  const content = (
    <>
      {icon ? <span className="text-base leading-none">{icon}</span> : null}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn} title={title} aria-disabled={disabled}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn}
      title={title}
    >
      {content}
    </button>
  );
}

