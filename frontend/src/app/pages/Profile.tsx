import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import type { User } from "../../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useParams } from "react-router";
import { useEffect } from "react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Camera } from "lucide-react";
import { FileUpload } from "../components/ui/fileUpload";
import { useAuth } from "../../hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AxiosError } from "axios";
import {
  MapPin,
  Linkedin,
  Edit3,
  DollarSign,
  Award,
  Building,
} from "lucide-react";

import api from "../../services/axios";

const roleColors: Record<
  "EXPERT" | "STARTUP" | "MEMBER" | "ADMIN" | "INVESTOR",
  string
> = {
  EXPERT: "bg-green-100 text-green-700",
  STARTUP: "bg-blue-100 text-blue-700",
  MEMBER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  INVESTOR: "bg-yellow-100 text-yellow-700",
};

//const stageOptions = ["IDEA", "PROTOTYPE", "MVP", "GROWTH", "SCALING"];

export default function Profile() {
  const { user, setUser } = useAuth();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // If viewing own profile
        if (!id || id === "me") {
          setProfileUser(user);
          return;
        }

        // If viewing another user
        const { data } = await api.get(`/users/${id}`);
        setProfileUser(data);
      } catch (err) {
        const error = err as AxiosError;

        // 🚨 If user not found (404)
        if (error.response?.status === 404) {
          setProfileUser(null); // IMPORTANT
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);
  //  Fetch user
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.profile) return;

    try {
      const { data } = await api.put("/auth/update-profile", {
        name: formData.name,
        bio: formData.profile.bio,
        location: formData.profile.location,
        linkedIn: formData.profile.linkedIn,
        companyName: formData.profile.companyName,
        stage: formData.profile.stage,
        hourlyRate: formData.profile.hourlyRate,
        expertise: formData.profile.expertise,
      });

      //  USE BACKEND RESPONSE
      setUser(data);

      setEditModalOpen(false);
      setProfileUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSkill = () => {
    if (!formData || !formData.profile) return;
    const trimmed = newSkill.trim();

    if (trimmed && !(formData.profile.expertise ?? []).includes(trimmed)) {
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          expertise: [...formData.profile.expertise, trimmed],
        },
      });

      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    if (!formData || !formData.profile) return;
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        expertise: formData.profile.expertise.filter((s) => s !== skill),
      },
    });
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (loading) return <div>Loading...</div>;
  if (!profileUser || !profileUser.profile) return <div>User not found</div>;

  const profile = profileUser.profile;
  const isOwnProfile = user?.id === profileUser.id;
  return (
    <div>
      {/* Cover */}
      <div className="relative h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl mb-20">
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <Avatar className="size-32 border-4 border-white shadow-xl">
              <AvatarImage
                src={profile.avatar || undefined}
                alt={profileUser.name}
              />
              <AvatarFallback className="bg-indigo-600 text-white text-3xl font-semibold">
                {getInitials(profileUser.name)}
              </AvatarFallback>
            </Avatar>

            {/* Upload Button */}
            <div className="absolute bottom-2 right-2">
              {isOwnProfile && (
                <FileUpload
                  accept="image/*"
                  maxSize={5}
                  existingFileUrl={profile.avatar || undefined}
                  onFileSelect={async (file) => {
                    if (!file || !profileUser?.profile || !isOwnProfile) return;

                    try {
                      const { data } = await api.put("/auth/update-profile", {
                        name: profileUser.name,
                        bio: profileUser.profile.bio,
                        location: profileUser.profile.location,
                        linkedIn: profileUser.profile.linkedIn,
                        companyName: profileUser.profile.companyName,
                        stage: profileUser.profile.stage,
                        hourlyRate: profileUser.profile.hourlyRate,
                        expertise: profileUser.profile.expertise,
                        avatar: file.url,
                      });

                      setUser(data); // update auth
                      setProfileUser(data); // update profile page
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <Button
                    size="icon"
                    className="rounded-full bg-white shadow hover:bg-gray-100 transition"
                  >
                    <Camera className="size-4 text-gray-700" />
                  </Button>
                </FileUpload>
              )}
            </div>
          </div>
        </div>

        <div className="absolute top-6 right-6">
          {isOwnProfile && (
            <Button
              onClick={() => {
                if (!profileUser.profile) return;

                setFormData(profileUser);
                setEditModalOpen(true);
              }}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 
text-white border border-white/30 gap-2"
            >
              <Edit3 className="size-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mt-20 mb-8 ml-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-semibold">{profileUser.name}</h1>
          <Badge className={roleColors[profileUser.role]}>
            {profileUser.role}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            {profile.location}
          </div>
          {profile.linkedIn && (
            <a
              href={profile.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* About */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </CardContent>
          </Card>

          {profileUser.role === "EXPERT" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="size-5" />
                  Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-semibold text-indigo-600 mb-1">
                    ${profile.hourlyRate}
                  </p>
                  <p className="text-gray-600">per hour</p>
                </div>
              </CardContent>
              <CardContent className="flex flex-wrap gap-2">
                {profile.expertise.map((skill: string) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {profileUser.role === "STARTUP" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <Building className="size-5" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{profile.companyName || "No company name set"}</p>
                <Badge>{profile.stage || "No stage set"}</Badge>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* RATE CARD - Expert Only */}
          {profileUser.role === "EXPERT" && (
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <DollarSign className="size-5" />
                  Consulting Rate
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-semibold text-indigo-600 mb-1">
                    ${profile.hourlyRate}
                  </p>
                  <p className="text-gray-600">per hour</p>
                </div>

                <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">
                  Book Consultation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* CONTACT CARD - ALL USERS */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Location</p>
                <p className="font-medium text-gray-900">{profile.location}</p>
              </div>

              {profile.linkedIn && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Professional Links
                  </p>
                  <a
                    href={profile.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Linkedin className="size-4" />
                    <span className="text-sm">View LinkedIn</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal */}

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Edit3 className="size-6 text-indigo-600" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>

          {formData && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-6 py-4">
                {/* BASIC INFO */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input
                      value={formData.profile?.location ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile!,
                            location: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label>Bio *</Label>
                    <Textarea
                      rows={5}
                      value={formData.profile?.bio ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile!,
                            bio: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <Label>LinkedIn Profile</Label>
                    <Input
                      type="url"
                      value={formData.profile?.linkedIn ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile!,
                            linkedIn: e.target.value,
                          },
                        })
                      }
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>

                {/* EXPERT SECTION */}
                {formData.role === "EXPERT" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900">
                      Expert Information
                    </h3>

                    {/* Hourly Rate */}
                    <div className="space-y-2">
                      <Label>Hourly Rate ($) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.profile?.hourlyRate ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile!,
                              hourlyRate: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>

                    {/* Expertise */}
                    <div className="space-y-2">
                      <Label>Areas of Expertise *</Label>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add expertise area..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSkill}
                        >
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.profile?.expertise.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="bg-indigo-50 border-indigo-200 text-indigo-700 px-3 py-1 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STARTUP SECTION */}
                {formData.role === "STARTUP" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900">
                      Company Information
                    </h3>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={formData.profile?.companyName ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile!,
                              companyName: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>

                    {/* Stage */}
                    <div className="space-y-2">
                      <Label>Company Stage *</Label>
                      <Select
                        value={formData.profile?.stage ?? ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile!,
                              stage: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDEA">IDEA</SelectItem>
                          <SelectItem value="PROTOTYPE">PROTOTYPE</SelectItem>
                          <SelectItem value="MVP">MVP</SelectItem>
                          <SelectItem value="GROWTH">GROWTH</SelectItem>
                          <SelectItem value="SCALING">SCALING</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
