import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#F9FAFB] font-sans selection:bg-[#6366F1] selection:text-white">
      <Navbar />
      {/* Page container wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}