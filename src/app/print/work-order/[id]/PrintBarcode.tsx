"use client";

import React from "react";
import Barcode from "react-barcode";

export default function PrintBarcode({ value, height = 40, width = 1.2 }: { value: string, height?: number, width?: number }) {
  return (
    <Barcode 
      value={value} 
      height={height} 
      width={width} 
      displayValue={false} 
      margin={0} 
      background="transparent" 
    />
  );
}
