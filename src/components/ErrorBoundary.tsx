// src/components/ErrorBoundary.tsx
"use client";
import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Error loading team statistics. Please try again later.</div>;
    }

    return this.props.children;
  }
}
