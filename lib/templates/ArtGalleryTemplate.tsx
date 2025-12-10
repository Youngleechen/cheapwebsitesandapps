// lib/templates/ArtGalleryTemplate.tsx
export default function ArtGalleryTemplate() {
  return (
    <div style={{ padding: '2rem', background: '#0f0f0f', color: 'white', minHeight: '100vh' }}>
      <h1>✨ Simple Art Gallery</h1>
      <p>This is a minimal, working gallery under dynamic route.</p>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2>Midnight Garden</h2>
          <p>by Elena Vostok</p>
        </div>
        <div>
          <h2>Neon Dreams</h2>
          <p>by Kaito Nakamura</p>
        </div>
      </div>
    </div>
  );
}