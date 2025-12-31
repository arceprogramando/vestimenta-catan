export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-muted rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-lg font-medium">Cargando...</p>
    </div>
  );
}
