import * as React from 'react';

interface PrayingHandsProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const PrayingHands = React.forwardRef<SVGSVGElement, PrayingHandsProps>(
  ({ size = 24, strokeWidth = 2, className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* Left forearm + palm raised, fingers up */}
      <path d="M9 21c-2.5 0-4-1.7-4-4l.6-5.3A1.6 1.6 0 0 1 8.8 12V6.5a1.5 1.5 0 0 1 3 0V12" />
      {/* Right forearm + palm raised, fingers up */}
      <path d="M15 21c2.5 0 4-1.7 4-4l-.6-5.3A1.6 1.6 0 0 0 15.2 12V6.5a1.5 1.5 0 0 0-3 0V12" />
      {/* Cupped palms meeting at the centre */}
      <path d="M9 21h6" />
      <path d="M12 12v4" />
    </svg>
  )
);

PrayingHands.displayName = 'PrayingHands';

export default PrayingHands;
