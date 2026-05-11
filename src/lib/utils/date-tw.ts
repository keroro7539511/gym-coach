const TZ = "Asia/Taipei";

/** 回傳台灣今天的日期字串 YYYY-MM-DD */
export function todayTW(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
}

/** 回傳台灣現在的 ISO 字串（含時區偏移） */
export function nowTW(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T") + "+08:00";
}
