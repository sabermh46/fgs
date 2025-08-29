import Link from "next/link";

function HomePage() {
  return (<div className="flex flex-col items-center justify-center min-h-screen py-2">
    <h1 className="text-4xl font-bold mb-4">Welcome to Pepti.wiki</h1>
    <p className="text-lg text-center max-w-xl">Your comprehensive peptide database and management tool.</p>
    <div className="py-40">
      <Link href="/dashboard" className="bg-accent px-4 py-1 text-lg rounded">Dashboard</Link>
    </div>
  </div>);
}

export default HomePage;
