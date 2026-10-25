"use client"
import { Component, type ReactNode } from "react"
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <p
        role="status"
        className="h-full flex items-center justify-center px-8 text-center text-muted-foreground"
      >
        The 3D view is unavailable. You can still explore every planet using the list.
      </p>
    ) : (
      this.props.children
    )
  }
}
