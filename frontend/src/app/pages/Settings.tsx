import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useEffect, useState } from "react";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import * as Switch from "@radix-ui/react-switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import api from "../../services/axios";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useToast } from "../../context/ToastContext";

interface NotificationSettings {
  emailOnBooking: boolean;
  emailOnMessage: boolean;
  emailOnReview: boolean;
}

interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  profileVisible: boolean;
}

// Reusable toggle using Radix + inline styles
function Toggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 9999,
        border: "none",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        backgroundColor: checked ? "#4f46e5" : "#d1d5db",
        transition: "background-color 200ms",
        flexShrink: 0,
      }}
    >
      <Switch.Thumb
        style={{
          display: "block",
          width: 16,
          height: 16,
          borderRadius: 9999,
          backgroundColor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(24px)" : "translateX(4px)",
          transition: "transform 200ms",
        }}
      />
    </Switch.Root>
  );
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);

  // Basic
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState("");

  // Extra profile fields
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [stage, setStage] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications & Privacy
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailOnBooking: true,
    emailOnMessage: true,
    emailOnReview: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showEmail: false,
    showPhone: false,
    profileVisible: true,
  });

  const [settingsSaving, setSettingsSaving] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me");

        setName(data.name || "");
        setEmail(data.email || "");
        setBio(data.profile?.bio || "");
        setPhone(data.profile?.phone || "");
        setLocation(data.profile?.location || "");
        setLinkedIn(data.profile?.linkedIn || "");
        setCompanyName(data.profile?.companyName || "");
        setStage(data.profile?.stage || "");
        setHourlyRate(
          data.profile?.hourlyRate ? data.profile.hourlyRate.toString() : "",
        );
        setExpertise(data.profile?.expertise || []);

        const { data: settingsData } = await api.get("/users/settings");
        if (settingsData.notifications)
          setNotifications(settingsData.notifications);
        if (settingsData.privacy) setPrivacy(settingsData.privacy);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // UPDATE PROFILE
  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const { data } = await api.put("/auth/update-profile", {
        name,
        bio,
        phone,
        location,
        linkedIn,
        companyName,
        stage,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        expertise,
      });
      setUser(data);
      showToast({
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showToast({
          type: "error",
          title: "Update Failed",
          message: error.response?.data?.message || "Error updating profile",
        });
      }
    }
    setLoading(false);
  };

  // UPDATE EMAIL
  const handleEmailUpdate = async () => {
    setLoading(true);
    try {
      await api.put("/auth/update-email", { email });
      showToast({
        type: "success",
        title: "Verification Email Sent",
        message: "Check your new email and click the verification link.",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showToast({
          type: "error",
          title: "Email Update Failed",
          message: error.response?.data?.message || "Error updating email",
        });
      }
    }
    setLoading(false);
  };

  // UPDATE PASSWORD
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      showToast({
        type: "warning",
        title: "Password Mismatch",
        message: "New password and confirm password do not match.",
      });
      return;
    }
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      showToast({
        type: "success",
        title: "Password Updated",
        message: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showToast({
          type: "error",
          title: "Password Update Failed",
          message: error.response?.data?.message || "Error updating password",
        });
      }
    }
    setLoading(false);
  };

  // UPDATE SETTINGS
  const handleSettingsUpdate = async () => {
    setSettingsSaving(true);
    try {
      await api.put("/users/settings", { notifications, privacy });
      showToast({
        type: "success",
        title: "Settings Saved",
        message: "Your preferences have been updated.",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showToast({
          type: "error",
          title: "Failed",
          message: error.response?.data?.message || "Could not save settings.",
        });
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 space-y-6 pb-10">
        <Card className="p-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </Card>
        <Card className="p-6 space-y-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-10 w-40" />
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 pb-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your profile and account preferences.
        </p>
      </Card>

      <Card className="p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB*/}
          <TabsContent value="profile" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                />
              </div>

              {user?.role === "STARTUP" && (
                <>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    <Input
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    />
                  </div>
                </>
              )}

              {user?.role === "EXPERT" && (
                <>
                  <div className="space-y-2">
                    <Label>Hourly Rate ($)</Label>
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expertise (comma separated)</Label>
                    <Input
                      value={expertise.join(", ")}
                      onChange={(e) =>
                        setExpertise(
                          e.target.value.split(",").map((item) => item.trim()),
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                className="min-h-[120px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <Button onClick={handleProfileUpdate} disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </div>
              ) : (
                "Save Profile"
              )}
            </Button>
          </TabsContent>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="space-y-8">
            <div className="space-y-4">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleEmailUpdate}
                disabled={loading || email === user?.email}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Update Email"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Change Password</Label>
              <Input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={handlePasswordUpdate} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Update Password"}
              </Button>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                Notification Preferences
              </h2>
              <p className="text-sm text-gray-500">
                Choose what emails you receive
              </p>
            </div>

            {(
              [
                {
                  key: "emailOnBooking" as const,
                  label: "Booking notifications",
                  desc: "When someone books or updates a consultation",
                },
                {
                  key: "emailOnMessage" as const,
                  label: "Message notifications",
                  desc: "When you receive a new message",
                },
                {
                  key: "emailOnReview" as const,
                  label: "Review notifications",
                  desc: "When someone leaves you a review",
                },
              ] as const
            ).map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b"
              >
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
                <Toggle
                  checked={notifications[key]}
                  onCheckedChange={(val) =>
                    setNotifications((prev) => ({ ...prev, [key]: val }))
                  }
                />
              </div>
            ))}

            <Button onClick={handleSettingsUpdate} disabled={settingsSaving}>
              {settingsSaving ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </div>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </TabsContent>

          {/* PRIVACY TAB */}
          <TabsContent value="privacy" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Privacy Settings</h2>
              <p className="text-sm text-gray-500">
                Control what others can see
              </p>
            </div>

            {(
              [
                {
                  key: "showEmail" as const,
                  label: "Show email on profile",
                  desc: "Allow others to see your email address",
                },
                {
                  key: "showPhone" as const,
                  label: "Show phone on profile",
                  desc: "Allow others to see your phone number",
                },
                {
                  key: "profileVisible" as const,
                  label: "Public profile",
                  desc: "Allow anyone to view your profile",
                },
              ] as const
            ).map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b"
              >
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
                <Toggle
                  checked={privacy[key]}
                  onCheckedChange={(val) =>
                    setPrivacy((prev) => ({ ...prev, [key]: val }))
                  }
                />
              </div>
            ))}

            <Button onClick={handleSettingsUpdate} disabled={settingsSaving}>
              {settingsSaving ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </div>
              ) : (
                "Save Settings"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
