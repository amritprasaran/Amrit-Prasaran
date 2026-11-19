export default function InfoPage({ title, content }: { title: string; content: string }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose max-w-none">{content}</div>
    </div>
  );
}
