export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1b4332] flex items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
