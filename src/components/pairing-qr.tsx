"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { createPairingToken } from "@/lib/actions/pairing";

interface Props {
  studentId: number;
  studentName: string;
  appUrl: string;
}

export function PairingQR({ studentId, studentName, appUrl }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const token = await createPairingToken(studentId);
    setUrl(`${appUrl}/pair/${token}`);
    setLoading(false);
  }

  if (!url) {
    return (
      <button
        onClick={generate}
        disabled={loading}
        className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline disabled:opacity-50"
      >
        {loading ? "產生中…" : "產生配對 QR →"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setUrl(null)}>
      <div
        className="rounded-2xl border border-border bg-[var(--surface-2)] p-8 max-w-sm w-full text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          配對 QR CODE
        </p>
        <p className="font-bold text-lg">{studentName}</p>

        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCode value={url} size={200} />
        </div>

        <p className="text-xs text-muted-foreground">
          請學員掃描此 QR code 設定帳號密碼
          <br />
          連結 24 小時後失效
        </p>

        <button
          onClick={() => setUrl(null)}
          className="text-xs text-muted-foreground hover:text-amber-500 transition-colors"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
