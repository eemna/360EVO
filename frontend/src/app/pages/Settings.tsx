import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useEffect, useState } from "react";
import { Textarea } from "../components/ui/textarea";
//import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import api from "../../services/axios";
//import { FileUpload } from "../components/ui/fileUpload";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useToast } from "../../context/ToastContext";

export default function Settings() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  // Basic
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState("");
  //const [avatar, setAvatar] = useState<string | null>(null);

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

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/me");

        setName(data.name || "");
        setEmail(data.email || "");
        setBio(data.profile?.bio || "");
        //setAvatar(data.profile?.avatar || null);
        setPhone(data.profile?.phone || "");
        setLocation(data.profile?.location || "");
        setLinkedIn(data.profile?.linkedIn || "");
        setCompanyName(data.profile?.companyName || "");
        setStage(data.profile?.stage || "");
        setHourlyRate(
          data.profile?.hourlyRate ? data.profile.hourlyRate.toString() : "",
        );
        setExpertise(data.profile?.expertise || []);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    fetchProfile();
  }, []);

  // ---------------- UPDATE PROFILE ----------------
  const handleProfileUpdate = async () => {
    setLoading(true);

    try {
      const { data } = await api.put("/auth/update-profile", {
        name,
        bio,
        //avatar,
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
  // ---------------- UPDATE EMAIL ----------------
  const handleEmailUpdate = async () => {
    setLoading(true);

    try {
      await api.put("/auth/update-email", { email });

      showToast({
        type: "success",
        title: "Email Updated",
        message: "Your email has been updated successfully.",
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

  // ---------------- UPDATE PASSWORD ----------------
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
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

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
          </TabsList>

          {/* ================= PROFILE TAB ================= */}
          <TabsContent value="profile" className="space-y-8">
            {/* Avatar Section */}

            {/* Basic Info Grid */}
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
                  </div>{" "}
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
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </TabsContent>

          {/* ================= ACCOUNT TAB ================= */}
          <TabsContent value="account" className="space-y-8">
            <div className="space-y-4">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleEmailUpdate} disabled={loading}>
                Update Email
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
                Update Password
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
