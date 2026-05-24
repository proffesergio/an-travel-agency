interface AtomLoaderProps {
  label?: string;
  sub?: string;
  fullScreen?: boolean;
}

export default function AtomLoader({
  label = 'Loading',
  sub = 'Please wait a moment',
  fullScreen = true,
}: AtomLoaderProps) {
  const inner = (
    <>
      <div className="atom-loader" aria-hidden>
        <div className="orbit">
          <span className="electron" />
        </div>
        <div className="orbit two">
          <span className="electron" />
        </div>
        <div className="orbit three">
          <span className="electron" />
        </div>
        <div className="nucleus" />
      </div>
      <p className="atom-label">{label}</p>
      <p className="atom-sub">{sub}</p>
    </>
  );

  if (!fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        {inner}
      </div>
    );
  }

  return (
    <div
      className="atom-loader-overlay"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {inner}
    </div>
  );
}
