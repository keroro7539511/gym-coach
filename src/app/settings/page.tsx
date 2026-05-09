import { db } from "@/lib/db/client";
import { coachSettings } from "@/lib/db/schema";
import { SettingsForm } from "@/components/settings-form";
import { updateSettings } from "@/lib/actions/settings";
import type { SettingsInput } from "@/lib/validators/settings";

export default async function SettingsPage() {
  const settings = db.select().from(coachSettings).limit(1).get();
  if (!settings) {
    return (
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <p className="text-rose-500">
          coach_settings 尚未初始化，請執行 <code className="font-mono">npm run db:seed</code>
        </p>
      </div>
    );
  }

  async function handle(input: SettingsInput) {
    "use server";
    await updateSettings(input);
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          SETTINGS
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          設定
        </h1>
      </header>
      <SettingsForm defaults={settings} onSubmit={handle} />
    </div>
  );
}
