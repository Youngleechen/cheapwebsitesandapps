// app/websites/content/my-blog/page.tsx
export const metadata = {
  title: 'My Awesome Blog',
  description: 'A beautiful blog showcasing my thoughts and ideas.',
};

export default function MyBlogPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-4">{metadata.title}</h1>
      <p className="text-gray-600">{metadata.description}</p>
    </div>
  );
}