import { useState, type FormEvent } from "react";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { useAuth } from "../context/AuthContext";

export default function UserProfiles() {
  const { user, updateProfile, changePassword } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url || null,
  );
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setRemoveAvatar(true);
    setAvatarPreview(null);
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        email,
        phone,
        ...(avatarFile ? { avatar: avatarFile } : {}),
        ...(removeAvatar ? { avatar: null } : {}),
      });
      setProfileMsg("Profile updated successfully.");
      setRemoveAvatar(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update profile.";
      setProfileErr(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPassMsg(null);
    setPassErr(null);
    if (newPassword !== confirmPassword) {
      setPassErr("Password confirmation does not match.");
      return;
    }
    setSavingPass(true);
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPassMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to change password.";
      setPassErr(message);
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Account | Profile"
        description="Manage your account profile and password."
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Profile
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your personal information
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 capitalize dark:text-brand-400">
              {user?.role?.replace("_", " ") || "Account"}
            </span>
          </div>

          {profileMsg && (
            <div className="mb-4 rounded-lg border border-success-500 bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
              {profileMsg}
            </div>
          )}
          {profileErr && (
            <div className="mb-4 rounded-lg border border-error-500 bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {profileErr}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/images/user/default-avatar.svg"
                    alt="Default avatar"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 sm:pt-2">
                {avatarFile ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {avatarFile.name} ({(avatarFile.size / 1024).toFixed(0)} KB)
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.avatar_url
                      ? "Current profile photo"
                      : "No profile photo yet"}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  {(avatarFile || user?.avatar_url) && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center rounded-lg border border-error-500/30 bg-error-50 px-4 py-2 text-sm font-medium text-error-600 transition hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full lg:w-auto" size="sm" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Account
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
              <Badge color="primary" variant="light">
                {user?.role.replace("_", " ") || "Account"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <Badge color="success" variant="light">
                Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Change Password
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Update your password to keep your account secure
          </p>

          {passMsg && (
            <div className="mb-4 rounded-lg border border-success-500 bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
              {passMsg}
            </div>
          )}
          {passErr && (
            <div className="mb-4 rounded-lg border border-error-500 bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {passErr}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
            <div className="lg:col-span-3">
              <Button size="sm" disabled={savingPass}>
                {savingPass ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
