/**
 * Subtle CSS-only gravitational background:
 * — concentric orbital rings rotating at different speeds
 * — bright "celestial bodies" pulsing on each orbit
 * — soft radial gradient core
 *
 * Designed as an abstract scientific evocation of cosmic creation.
 * Respects prefers-reduced-motion (animations stop, layout preserved).
 */
export default function GravityField({
  intensity = 'normal',
  className = '',
}: {
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}) {
  const opacity = intensity === 'subtle' ? 0.35 : intensity === 'strong' ? 0.9 : 0.6;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {/* radial glow core */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(116,198,157,0.35) 0%, rgba(45,106,79,0.12) 35%, transparent 70%)',
        }}
      />

      {/* Star dust */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(244,162,97,0.6) 0.5px, transparent 1.5px), radial-gradient(circle at 75% 60%, rgba(255,255,255,0.5) 0.5px, transparent 1.5px), radial-gradient(circle at 40% 80%, rgba(116,198,157,0.55) 0.5px, transparent 1.5px), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.4) 0.5px, transparent 1.5px), radial-gradient(circle at 10% 75%, rgba(244,162,97,0.4) 0.5px, transparent 1.5px)',
          backgroundSize: '420px 420px',
          animation: 'gravity-drift 38s linear infinite',
        }}
      />

      {/* Orbital rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[520px] max-h-[520px]">
        <div className="absolute inset-0 rounded-full border border-[#74c69d]/25 animate-gravity-orbit-slow">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_12px_2px_rgba(244,162,97,0.7)] animate-gravity-pulse" />
        </div>
        <div className="absolute inset-[8%] rounded-full border border-[#74c69d]/20 animate-gravity-orbit-medium-rev">
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.6)] animate-gravity-pulse"
            style={{ animationDelay: '0.6s' }}
          />
        </div>
        <div className="absolute inset-[18%] rounded-full border border-[#74c69d]/15 animate-gravity-orbit-medium">
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#74c69d] shadow-[0_0_14px_3px_rgba(116,198,157,0.7)] animate-gravity-pulse"
            style={{ animationDelay: '1.2s' }}
          />
        </div>
        <div className="absolute inset-[30%] rounded-full border border-[#74c69d]/10 animate-gravity-orbit-fast-rev">
          <span
            className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-200 shadow-[0_0_8px_1px_rgba(255,222,128,0.7)] animate-gravity-pulse"
            style={{ animationDelay: '1.8s' }}
          />
        </div>

        {/* Central sun */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_24px_6px_rgba(244,162,97,0.6)] animate-gravity-pulse" />
      </div>
    </div>
  );
}
