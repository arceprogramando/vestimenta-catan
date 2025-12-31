export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      {children}
    </div>
  );
}
