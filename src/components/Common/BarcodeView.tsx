import React from 'react';

interface BarcodeViewProps {
  value: string;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeView: React.FC<BarcodeViewProps> = ({
  value,
  height = 36,
  showText = true,
  className = '',
}) => {
  // Deterministic pseudo-barcode stripe generator based on value hash
  const generateBars = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    
    // Generate 45 alternating black/white bars with variable widths
    const bars: { width: number; isBlack: boolean }[] = [];
    let isBlack = true;
    
    // Start quiet zone & guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 2, isBlack: true });
    
    for (let i = 0; i < 30; i++) {
      const bit = Math.abs((hash ^ (i * 37)) % 3) + 1;
      bars.push({ width: bit, isBlack });
      isBlack = !isBlack;
    }

    // Stop guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 3, isBlack: true });

    return bars;
  };

  const bars = generateBars(value || '00000000');
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[200px]"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        {bars.map((bar, index) => {
          const xOffset = bars.slice(0, index).reduce((acc, b) => acc + b.width, 0);
          return bar.isBlack ? (
            <rect
              key={index}
              x={xOffset}
              y={0}
              width={bar.width}
              height={height}
              fill="currentColor"
            />
          ) : null;
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] tracking-widest text-slate-700 mt-0.5">
          *{value}*
        </span>
      )}
    </div>
  );
};
