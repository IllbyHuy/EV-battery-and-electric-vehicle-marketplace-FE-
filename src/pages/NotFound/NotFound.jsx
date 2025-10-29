export default function NotFound() {
  return (
    <div className="obys-hero min-h-screen py-20">
      <div className="container max-w-2xl">
        <div className="obys-card rounded-lg p-8 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white">404</h1>
          <p className="text-xl text-white/80 mb-4">Oops! Page not found</p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-[#7c5cff] to-[#4f46e5] text-white px-4 py-2 rounded"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
