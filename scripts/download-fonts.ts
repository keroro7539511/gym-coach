import { writeFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import path from "path";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

interface FontTarget {
  name: string;
  urls: string[];
}

const FONTS: FontTarget[] = [
  {
    name: "NotoSansTC-Regular.otf",
    urls: [
      "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf",
      "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/NotoSansCJKtc-Regular.otf",
    ],
  },
  {
    name: "NotoSansTC-Bold.otf",
    urls: [
      "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Bold.otf",
      "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/NotoSansCJKtc-Bold.otf",
    ],
  },
];

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadFont(url: string, dest: string) {
  console.log(`下載 ${path.basename(dest)}…`);
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buffer);
  console.log(`  → ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

(async () => {
  await mkdir(FONTS_DIR, { recursive: true });
  for (const f of FONTS) {
    const dest = path.join(FONTS_DIR, f.name);
    if (await exists(dest)) {
      console.log(`已存在 ${f.name}，跳過`);
      continue;
    }
    let lastError: unknown = null;
    let downloaded = false;
    for (const url of f.urls) {
      try {
        await downloadFont(url, dest);
        downloaded = true;
        break;
      } catch (err) {
        lastError = err;
        console.error(`  嘗試失敗：${url}`);
      }
    }
    if (!downloaded) {
      console.error(`下載失敗：${f.name}`, lastError);
      console.error("PDF 中文可能會變方框。可手動下載字型放到 public/fonts/");
    }
  }
})();
