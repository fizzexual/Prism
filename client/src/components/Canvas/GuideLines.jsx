/** Pink alignment guides shown while dragging. */
export default function GuideLines({ lines = [], zoom = 1 }) {
  return lines.map((l, i) =>
    l.axis === 'x' ? (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: l.pos,
          top: l.from,
          width: 1 / zoom,
          height: Math.max(0, l.to - l.from),
          background: '#ec4899',
          pointerEvents: 'none',
          zIndex: 100001,
        }}
      />
    ) : (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: l.pos,
          left: l.from,
          height: 1 / zoom,
          width: Math.max(0, l.to - l.from),
          background: '#ec4899',
          pointerEvents: 'none',
          zIndex: 100001,
        }}
      />
    ),
  );
}
