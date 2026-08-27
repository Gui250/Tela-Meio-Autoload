import Image from "next/image";

const ASPECT_RATIO = 671 / 477;

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/brand/automind-mark.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * ASPECT_RATIO)}
      height={size}
      priority
    />
  );
}
