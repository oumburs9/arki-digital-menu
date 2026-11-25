import { useState } from "react";
import Icon, { categoryIcon } from "./Icon";

/** Item photo with a branded fallback if the image can't load (slow network, offline). */
export default function Photo({ src, alt, categoryId, className }: { src?: string; alt: string; categoryId?: string; className?: string }) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  if (failed)
    return (
      <div className={`photo-fallback ${className ?? ""}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
        <Icon name={categoryIcon(categoryId)} size={28} strokeWidth={1.5} />
      </div>
    );
  return (
    <img
      className={`${className ?? ""} ${loaded ? "is-loaded" : "is-loading"}`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
