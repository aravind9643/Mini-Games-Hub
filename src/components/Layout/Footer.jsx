export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="page-container" style={{ padding: '0 2rem' }}>
        <p>&copy; {currentYear} Games Hub — Premium Online Mini Games.</p>
        <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          Built with React and Vite. Responsive, serverless, and 100% private.
        </p>
      </div>
    </footer>
  );
}
