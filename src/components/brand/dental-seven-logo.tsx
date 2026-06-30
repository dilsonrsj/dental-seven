import Image from "next/image";
import Link from "next/link";

type DentalSevenLogoProps = {
  variant?: "full" | "mark";
  surface?: "entrar" | "app" | "transparent";
  height?: number;
  className?: string;
  href?: string;
  priority?: boolean;
};

const srcMap = {
  "full-transparent": "/brand/dental-seven-logo-transparent-v2.png",
  "full-entrar": "/brand/dental-seven-logo-on-entrar-v2.png",
  "full-app": "/brand/dental-seven-logo-on-dark-v2.png",
  "mark-transparent": "/brand/dental-seven-icon-transparent-v2.png",
  "mark-app": "/brand/dental-seven-icon-on-dark-v2.png",
} as const;

function resolveSrc(variant: "full" | "mark", surface: "entrar" | "app" | "transparent") {
  if (surface === "transparent") {
    return variant === "full" ? srcMap["full-transparent"] : srcMap["mark-transparent"];
  }
  if (variant === "mark") return srcMap["mark-app"];
  return surface === "entrar" ? srcMap["full-entrar"] : srcMap["full-app"];
}

const FULL_LOGO_ASPECT = 1536 / 1024;

function resolveDimensions(variant: "full" | "mark", height: number) {
  if (variant === "full") {
    return {
      height,
      width: Math.round(height * FULL_LOGO_ASPECT),
    };
  }

  return { height, width: height };
}

export function DentalSevenLogo({
  variant = "full",
  surface = "transparent",
  height = 48,
  className = "",
  href,
  priority = false,
}: DentalSevenLogoProps) {
  const { width, height: imageHeight } = resolveDimensions(variant, height);

  const image = (
    <Image
      src={resolveSrc(variant, surface)}
      alt="Dental Seven"
      height={imageHeight}
      width={width}
      className={className}
      priority={priority}
      unoptimized
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    );
  }

  return image;
}
