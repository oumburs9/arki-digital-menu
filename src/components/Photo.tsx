import { useState } from "react";

/** Item photo with a branded fallback if the image can't load (slow network, offline). */
export default function Photo({ src, alt, icon, className }: { src?: string; alt: string; icon: string; className?: string }) {
  const [failed, setFailed] = useState(!src);
  if (failed)
    return (
      <div className={`photo-fallback ${className ?? ""}`} role="img" aria-label={alt}>
        <span>{icon}</span>
      </div>
    );
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
