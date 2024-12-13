/** @jsx h */
import { h } from "preact";

export function NotFoundPage() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      height: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1 style={{
        fontSize: "4rem",
        margin: "0 0 1rem 0"
      }}>404</h1>
      <p style={{
        fontSize: "1.5rem",
        margin: "0",
        color: "#666"
      }}>Page not found</p>
      <a href="/" style={{
        marginTop: "2rem",
        color: "#0066cc",
        textDecoration: "none"
      }}>Return home</a>
    </div>
  );
}
