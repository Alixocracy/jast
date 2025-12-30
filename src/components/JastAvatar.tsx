import { cn } from "@/lib/utils";
import type { FC } from "react";

type JastAvatarProps = {
  className?: string;
  size?: number;
};

export const JastAvatar: FC<JastAvatarProps> = ({ className, size = 48 }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-white shadow-soft ring-1 ring-black/5 flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src="/JAST.png"
        alt="JAST logo"
        className="w-full h-full object-cover"
        width={size}
        height={size}
        loading="lazy"
      />
    </div>
  );
};
