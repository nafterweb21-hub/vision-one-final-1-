"use client";

import { useState } from "react";

export default function CompanyLogo({ src, alt, companyName, className, style }: { src: string; alt: string; companyName?: string; className?: string; style?: React.CSSProperties }) {
  const [error, setError] = useState(false);
  const finalSrc = src.startsWith("/uploads") ? `/api${src}` : src;

  if (error || !src) {
    if (companyName) {
      return <div className={`font-bold text-xl ${className || ""}`} style={style}>{companyName}</div>;
    }
    return <div className={`font-bold text-xl text-gray-400 ${className || ""}`} style={style}>LOGO NOT FOUND</div>;
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
