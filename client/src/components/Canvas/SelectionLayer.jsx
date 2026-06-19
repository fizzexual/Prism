const HANDLES = [
  { k: 'nw', hx: -1, hy: -1, cursor: 'nwse-resize' },
  { k: 'n', hx: 0, hy: -1, cursor: 'ns-resize' },
  { k: 'ne', hx: 1, hy: -1, cursor: 'nesw-resize' },
  { k: 'w', hx: -1, hy: 0, cursor: 'ew-resize' },
  { k: 'e', hx: 1, hy: 0, cursor: 'ew-resize' },
  { k: 'sw', hx: -1, hy: 1, cursor: 'nesw-resize' },
  { k: 's', hx: 0, hy: 1, cursor: 'ns-resize' },
  { k: 'se', hx: 1, hy: 1, cursor: 'nwse-resize' },
];

/** Selection box with 8 resize handles + a rotate handle for a single element. */
export default function SelectionLayer({ rect, zoom = 1, onResizeStart, onRotateStart }) {
  const { x, y, width, height, rotation = 0 } = rect;
  const hs = 10 / zoom;
  const bw = 1.5 / zoom;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        zIndex: 100000,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, outline: `${bw}px solid #6366f1` }} />

      {HANDLES.map((h) => (
        <div
          key={h.k}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart({ hx: h.hx, hy: h.hy }, e);
          }}
          style={{
            position: 'absolute',
            width: hs,
            height: hs,
            background: '#ffffff',
            border: `${bw}px solid #6366f1`,
            borderRadius: 2 / zoom,
            left: `calc(${((h.hx + 1) / 2) * 100}% - ${hs / 2}px)`,
            top: `calc(${((h.hy + 1) / 2) * 100}% - ${hs / 2}px)`,
            cursor: h.cursor,
            pointerEvents: 'auto',
          }}
        />
      ))}

      {/* rotate handle stem + knob above top-center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -22 / zoom,
          width: bw,
          height: 22 / zoom,
          background: '#6366f1',
        }}
      />
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onRotateStart(e);
        }}
        style={{
          position: 'absolute',
          left: `calc(50% - ${hs / 2}px)`,
          top: -22 / zoom - hs,
          width: hs,
          height: hs,
          borderRadius: '50%',
          background: '#ffffff',
          border: `${bw}px solid #6366f1`,
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}
