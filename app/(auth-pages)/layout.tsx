export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center py-10 bg-accent/10">
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
        <div className="shadow-xl rounded-2xl p-12 w-full h-full bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}
