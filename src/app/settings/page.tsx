import { db } from "@/lib/db/client";
import { coachSettings } from "@/lib/db/schema";
import { SettingsForm } from "@/components/settings-form";
import { updateSettings } from "@/lib/actions/settings";
import type { SettingsInput } from "@/lib/validators/settings";

export default async function SettingsPage() {
  const settings = db.select().from(coachSettings).limit(1).get();
  if (!settings) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">
          coach_settings 尚未初始化，請執行 `npm run db:seed`
        </p>
      </div>
    );
  }

  async function handle(input: SettingsInput) {
    "use server";
    await updateSettings(input);
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">設定</h1>
      <SettingsForm defaults={settings} onSubmit={handle} />
    </div>
  );
}
