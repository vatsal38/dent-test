"use client";

type Props = {
  name?: string | null;
  photoURL?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export function UserAvatar({
  name,
  photoURL,
  size = "md",
  className = "",
}: Props) {
  const dim = size === "sm" ? "w-8 h-8 text-sm" : "w-9 h-9 text-sm";
  const initial = name?.[0]?.toUpperCase() || "U";

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt=""
        className={`${dim} rounded-full object-cover shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
