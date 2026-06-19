import { useEffect, useState } from 'react';
import { useUI, useBuilder } from './store.js';

/**
 * Draws selection/hover outlines over the iframe. Positions are computed from
 * each node's getBoundingClientRect() (relative to the iframe viewport) plus
 * the iframe's own viewport offset, so the overlay uses fixed positioning.
 */
export default function Overlay({ iframeRef }) {
  const selectedId = useUI((s) => s.selectedId);
  const hoveredId = useUI((s) => s.hoveredId);
  const instances = useBuilder((s) => s.project?.instances);
  const [, force] = useState(0);

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const rerender = () => force((n) => (n + 1) % 1000000);
    const ro = new ResizeObserver(rerender);
    if (iframe) ro.observe(iframe);
    if (doc?.documentElement) ro.observe(doc.documentElement);
    doc?.addEventListener('scroll', rerender, true);
    window.addEventListener('resize', rerender);
    const interval = setInterval(rerender, 150); // catch layout shifts from style edits
    return () => {
      ro.disconnect();
      doc?.removeEventListener('scroll', rerender, true);
      window.removeEventListener('resize', rerender);
      clearInterval(interval);
    };
  }, [iframeRef]);

  const drawBox = (id, color, label) => {
    const iframe = iframeRef.current;
    const node = iframe?.contentDocument?.querySelector(`[data-ws-id="${id}"]`);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    const f = iframe.getBoundingClientRect();
    return (
      <div
        style={{
          position: 'fixed',
          left: f.left + r.left,
          top: f.top + r.top,
          width: r.width,
          height: r.height,
          border: `1px solid ${color}`,
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {label && (
          <span
            style={{
              position: 'absolute',
              top: -17,
              left: -1,
              background: color,
              color: '#fff',
              fontSize: 10,
              lineHeight: '16px',
              padding: '0 5px',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {hoveredId && hoveredId !== selectedId && drawBox(hoveredId, '#60a5fa')}
      {selectedId && drawBox(selectedId, '#4f46e5', instances?.[selectedId]?.label)}
    </>
  );
}
