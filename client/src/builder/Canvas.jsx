import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBuilder, useUI } from './store.js';
import { BREAKPOINTS, generateCss } from './cssGen.js';
import { InstanceRender } from './InstanceRender.jsx';
import Overlay from './Overlay.jsx';

const RESET = `*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0}body{min-height:100%}img{max-width:100%}`;
// Edit-mode helpers: show empty containers and a faint hover affordance.
const EDIT_HELPERS = `[data-ws-id]:empty{min-height:48px;min-width:48px;outline:1px dashed #cbd5e1;outline-offset:-1px}`;

export default function Canvas() {
  const project = useBuilder((s) => s.project);
  const styles = project?.styles;
  const breakpoint = useUI((s) => s.breakpoint);
  const previewMode = useUI((s) => s.previewMode);

  const iframeRef = useRef(null);
  const wsStyleRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  // Build the iframe document once.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(
      '<!doctype html><html><head><meta charset="utf-8"><style id="reset"></style><style id="ws"></style><style id="edit"></style></head><body></body></html>',
    );
    doc.close();
    doc.getElementById('reset').textContent = RESET;
    wsStyleRef.current = doc.getElementById('ws');
    setMountNode(doc.body);
    return undefined;
  }, []);

  // Keep the generated stylesheet in sync with the styles map.
  useEffect(() => {
    if (wsStyleRef.current) wsStyleRef.current.textContent = generateCss(styles || {});
  }, [styles]);

  // Toggle edit-only helper styles.
  useEffect(() => {
    const editEl = iframeRef.current?.contentDocument?.getElementById('edit');
    if (editEl) editEl.textContent = previewMode ? '' : EDIT_HELPERS;
  }, [previewMode, mountNode]);

  // Native select/hover listeners inside the iframe (edit mode only).
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || previewMode) return undefined;
    const idOf = (e) => e.target.closest?.('[data-ws-id]')?.getAttribute('data-ws-id') || null;
    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      useUI.getState().select(idOf(e));
    };
    const onMove = (e) => useUI.getState().hover(idOf(e));
    const onLeave = () => useUI.getState().hover(null);
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('mousemove', onMove);
    doc.addEventListener('mouseleave', onLeave);
    return () => {
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('mousemove', onMove);
      doc.removeEventListener('mouseleave', onLeave);
    };
  }, [mountNode, previewMode]);

  const page = project?.pages?.[0];
  const width = BREAKPOINTS[breakpoint]?.width || 1280;

  return (
    <div className="relative flex-1 overflow-auto bg-neutral-200/70">
      <div className="flex min-h-full justify-center p-6">
        <div
          className="shrink-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,.1),0_12px_40px_rgba(0,0,0,.08)]"
          style={{ width }}
          onClick={() => useUI.getState().select(null)}
        >
          {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
          <iframe
            ref={iframeRef}
            title="Canvas"
            className="block h-full w-full border-0"
            style={{ minHeight: 'calc(100vh - 96px)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      {mountNode && project && page && createPortal(<InstanceRender id={page.rootId} instances={project.instances} />, mountNode)}
      {!previewMode && <Overlay iframeRef={iframeRef} />}
    </div>
  );
}
