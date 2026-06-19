import { useEffect, useState } from 'react';
import { loadModel } from './loaderRegistry.js';

// Cache loaded source objects by url; each consumer gets an independent clone.
const cache = new Map();

/** Load a 3D model from a url. Returns { object, loading, error }. */
export function useModel(url, format) {
  const [state, setState] = useState({ object: null, loading: !!url, error: null });

  useEffect(() => {
    let active = true;
    if (!url) {
      setState({ object: null, loading: false, error: null });
      return undefined;
    }
    if (cache.has(url)) {
      setState({ object: cache.get(url).clone(true), loading: false, error: null });
      return undefined;
    }
    setState({ object: null, loading: true, error: null });
    loadModel(url, format)
      .then((obj) => {
        if (!active) return;
        cache.set(url, obj);
        setState({ object: obj.clone(true), loading: false, error: null });
      })
      .catch((err) => {
        if (!active) return;
        setState({ object: null, loading: false, error: err.message || 'Failed to load model' });
      });
    return () => {
      active = false;
    };
  }, [url, format]);

  return state;
}
