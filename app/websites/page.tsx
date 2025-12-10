// app/websites/page.tsx
export default function WebsitesPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>My Websites</h1>
      <p>This is a static page with no data fetching.</p>
      <ul>
        <li>Website 1</li>
        <li>Website 2</li>
        <li>Website 3</li>
      </ul>
    </div>
  );
}