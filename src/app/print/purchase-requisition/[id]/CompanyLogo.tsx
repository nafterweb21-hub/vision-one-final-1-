"use client";

import { useState } from "react";

export default function CompanyLogo({ src, alt, companyName, className, style }: { src: string; alt: string; companyName?: string; className?: string; style?: React.CSSProperties }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#111', ...style }}>
        {companyName || alt}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
