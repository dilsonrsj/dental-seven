import Image from "next/image";

type Dr7LogoProps = {
  variant?: "on-dark" | "on-light";
  className?: string;
  height?: number;
};

const srcMap = {
  "on-dark": "/brand/dr7-logo-dark-bg.png",
  "on-light": "/brand/dr7-logo-light-bg.png",
} as const;

export function Dr7Logo({
  variant = "on-dark",
  className = "",
  height = 48,
}: Dr7LogoProps) {
  return (
    <Image
      src={srcMap[variant]}
      alt="DR7 Performance"
      height={height}
      width={Math.round(height * 2.8)}
      className={className}
      priority
    />
  );
}
