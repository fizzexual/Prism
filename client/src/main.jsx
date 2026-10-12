import ReactDOM from 'react-dom/client';
import BuilderApp from './builder/BuilderApp.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';
import { useBuilder, useUI } from './builder/store.js';
import * as actions from './builder/actions.js';

// Expose stores in dev for debugging and automated verification.
if (import.meta.env.DEV) {
  window.__prism = { useBuilder, useUI, actions };
  import('./builder/exportSite.js').then(({ exportHtml }) => { window.__prism.exportHtml = exportHtml; });
}

// NOTE: StrictMode is intentionally omitted — the iframe canvas does imperative
// document setup that doesn't play well with StrictMode's double-invoked effects.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BuilderApp />
  </ErrorBoundary>,
);
