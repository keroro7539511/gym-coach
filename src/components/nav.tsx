import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link href="/" className="font-bold text-lg">
          健身教練管理
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/students" className="hover:underline">
            學員
          </Link>
          <Link href="/exercises" className="hover:underline">
            動作主檔
          </Link>
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
        </div>
      </div>
    </nav>
  );
}
