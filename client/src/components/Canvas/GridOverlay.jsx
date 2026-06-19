/** Faint grid drawn behind elements when the grid is enabled. */
export default function GridOverlay({ size = 8 }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(to right, rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.05) 1px, transparent 1px)',
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
