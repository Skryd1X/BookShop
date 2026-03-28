import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  gender: string;
  city: string;
  address: string;
  avatar_url: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    birth_date: "",
    gender: "",
    city: "",
    address: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        birth_date: data.birth_date || "",
        gender: data.gender || "",
        city: data.city || "",
        address: data.address || "",
        avatar_url: data.avatar_url || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        birth_date: profile.birth_date || null,
        gender: profile.gender,
        city: profile.city,
        address: profile.address,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      toast.success("Профиль сохранён");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Ошибка загрузки фото");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = data.publicUrl + "?t=" + Date.now();

    await supabase
      .from("profiles")
      .update({ avatar_url })
      .eq("user_id", user.id);

    setProfile((prev) => ({ ...prev, avatar_url }));
    toast.success("Фото обновлено");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  const initials = (profile.first_name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="container max-w-2xl py-8">
      <div
        className="bg-card rounded-2xl border border-border p-8"
        style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-accent flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <label className="absolute inset-0 rounded-full flex items-center justify-center bg-foreground/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-background" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
        </div>

        {/* Form */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Имя" value={profile.first_name} onChange={(v) => setProfile({ ...profile, first_name: v })} />
          <Field label="Фамилия" value={profile.last_name} onChange={(v) => setProfile({ ...profile, last_name: v })} />
          <Field label="Телефон" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="+998 90 123 45 67" />
          <Field label="Дата рождения" value={profile.birth_date} onChange={(v) => setProfile({ ...profile, birth_date: v })} type="date" />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Пол</label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Не указано</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>
          <Field label="Город" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} placeholder="Ташкент" />
          <div className="sm:col-span-2">
            <Field label="Адрес" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} placeholder="ул. Навои, д. 1" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors active:scale-[0.97] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors active:scale-[0.97]"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
