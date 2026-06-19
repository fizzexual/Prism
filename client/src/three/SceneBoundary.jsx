import { Component } from 'react';

/**
 * Error boundary for 3D content. Used to keep an optional feature (e.g. an
 * environment HDR that fails to fetch offline) from crashing the whole app.
 */
export default class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    /* swallow — fallback is rendered instead */
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
