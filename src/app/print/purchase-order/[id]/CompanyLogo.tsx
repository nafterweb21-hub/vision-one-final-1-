"use client";

import { useState } from "react";

export default function CompanyLogo({ src, alt, companyName, className, style }: { src: string; alt: string; companyName?: string; className?: string; style?: React.CSSProperties }) {
  const [error, setError] = useState(false);
  const finalSrc = src.startsWith("/uploads") ? `/api${src}` : src;

  if (!src || error) {
    return (
      <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#111', ...style }}>
        {companyName || alt}
      </span>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
