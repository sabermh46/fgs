import Link from "next/link";
import Image from "next/image";

function HomePage() {
  return (
    <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white m-10 rounded-4xl">
      {/* Background Image */}
      <div className="absolute inset-0 rounded-4xl overflow-hidden">
        <Image
          src="/image.png" // place the generated image inside /public/backgrounds/
          alt="Peptide Background"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
          Peptide Calculator
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-200">
          Easily calculate peptide molecular weight, mass, and other essential properties.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl shadow-lg text-white text-lg font-semibold transition"
          >
            Dashboard
          </Link>

        </div>
      </div>
    </div>
  );
}

export default HomePage;
