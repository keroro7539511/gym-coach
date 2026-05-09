export default function InvalidTokenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 text-center">
      <div>
        <p className="text-sm font-extrabold tracking-[3px] uppercase text-amber-500 mb-4">
          GYM · COACH
        </p>
        <h1 className="text-2xl font-extrabold">連結無效或已過期</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          請請教練重新產生 QR code
        </p>
      </div>
    </div>
  );
}
