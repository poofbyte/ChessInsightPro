import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-teal-500">404</h1>
        <p className="text-slate-500 font-semibold">Page not found</p>
        <Link href="/" className="inline-block px-6 py-3 bg-teal-500 text-black font-bold rounded-xl hover:bg-teal-400 transition">
          Go Home
        </Link>
      </div>
    </div>
  );
}
