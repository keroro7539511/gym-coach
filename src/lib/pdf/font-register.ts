import "server-only";
import path from "path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoSansTC",
    fonts: [
      {
        src: path.join(fontsDir, "NotoSansTC-Regular.otf"),
        fontWeight: "normal",
      },
      {
        src: path.join(fontsDir, "NotoSansTC-Bold.otf"),
        fontWeight: "bold",
      },
    ],
  });
  // 預防斷詞錯誤：把中文當作每字可斷
  Font.registerHyphenationCallback((word) =>
    word.length > 1 ? Array.from(word) : [word]
  );
}
