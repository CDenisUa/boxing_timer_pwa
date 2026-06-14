// Core
import { memo, useEffect, useRef, useState } from 'react';

type Props = {
  progress: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
};

const clamp = (value: number): number => {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const SemiCircularProgressComponent = ({
  progress,
  color,
  trackColor,
  size = 250,
  strokeWidth = 10,
}: Props) => {
  const [animatedProgress, setAnimatedProgress] = useState(clamp(progress));
  const currentRef = useRef(clamp(progress));

  useEffect(() => {
    const next = clamp(progress);
    const start = currentRef.current;
    const durationMs = 220;
    const startedAt = Date.now();
    let frameId: number | null = null;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      const value = start + (next - start) * eased;
      currentRef.current = value;
      setAnimatedProgress(value);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  const startX = centerX - radius;
  const startY = centerY;
  const endX = centerX + radius;
  const endY = centerY;

  const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - animatedProgress);
  const height = size / 2 + strokeWidth;

  return (
    <div
      style={{
        width: size,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={height}>
        <path
          d={arcPath}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={arcPath}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </div>
  );
};

export const SemiCircularProgress = memo(SemiCircularProgressComponent);
