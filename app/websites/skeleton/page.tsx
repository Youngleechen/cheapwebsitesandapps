// app/websites/whynowebsite/page.tsx
export default function WhyNoWebsitePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f9fafb',
        color: '#111827',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
        Why No Website?
      </h1>
      <p style={{ fontSize: '1.125rem', maxWidth: '600px', lineHeight: 1.6 }}>
        Every idea deserves a home on the web. If you don’t have a website yet—now’s the time.
      </p>
    </div>
  );
}