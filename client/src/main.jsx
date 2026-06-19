import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';
import { useDocumentStore } from './state/documentStore.js';
import { useEditorStore } from './state/editorStore.js';
import { createElement } from './elements/registry.jsx';
import { exportProject } from './export/exportProject.js';

// Expose stores in dev for debugging and automated verification.
if (import.meta.env.DEV) {
  window.__prism = { useDocumentStore, useEditorStore, createElement, exportProject };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
