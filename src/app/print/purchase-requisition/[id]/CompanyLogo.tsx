"use client";

import { useState } from "react";

export default function CompanyLogo({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const finalSrc = src || "/logo.jpg";

  return (
    <img 
      src={finalSrc} 
      alt={alt} 
      className={className} 
      style={style} 
    />
  );
}
