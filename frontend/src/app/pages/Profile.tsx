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
import ExpertProfile from "./ExpertProfile";
import { useNavigate } from "react-router";
import { useToast } from "../../context/ToastContext";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import TagInputSection from "../components/ui/TagInputSection";
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
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AxiosError } from "axios";
// import { format } from "date-fns";
import {
  MapPin,
  Linkedin,
  Phone,
  Edit3,
  Building,
  CheckCircle,
  DollarSign,
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
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const { user, setUser } = useAuth();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newCertification, setNewCertification] = useState("");

  const { id } = useParams();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const targetId = !id || id === "me" ? user?.id : id;

        if (!targetId) return;

        const { data } = await api.get(`/users/${targetId}`);
        setProfileUser(data);
      } catch (err) {
        const error = err as AxiosError;

        if (error.response?.status === 404) {
          setProfileUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [id, user]);
  //  Fetch user
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.profile) return;
    setSaving(true);

    try {
      const { data } = await api.put("/auth/update-profile", {
        name: formData.name,
        bio: formData.profile.bio,
        phone: formData.profile.phone,
        location: formData.profile.location,
        linkedIn: formData.profile.linkedIn,
        hourlyRate: Number(formData.profile.hourlyRate),
        yearsOfExperience: formData.profile.yearsOfExperience,
        expertise: formData.profile.expertise,
        industries: formData.profile.industries,
        certifications: formData.profile.certifications,
        availabilityStatus: formData.profile.availabilityStatus,
        weeklyAvailability: formData.profile.weeklyAvailability,
      });

      //  USE BACKEND RESPONSE
      setUser(data);

      setEditModalOpen(false);
      setProfileUser(data);
      showToast({
        type: "success",
        title: "Profile Updated ",
        message: "Your profile has been updated successfully.",
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        showToast({
          type: "error",
          title: "Update Failed",
          message: err.response?.data?.message || "Something went wrong",
        });
      } else {
        showToast({
          type: "error",
          title: "Unexpected Error",
          message: "Something went wrong",
        });
      }
    } finally {
      setSaving(false);
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

  const handleAddIndustry = () => {
    if (!formData || !formData.profile) return;
    const trimmed = newIndustry.trim();

    if (trimmed && !(formData.profile.industries ?? []).includes(trimmed)) {
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          industries: [...(formData.profile.industries ?? []), trimmed],
        },
      });
      setNewIndustry("");
    }
  };

  const handleRemoveIndustry = (industry: string) => {
    if (!formData || !formData.profile) return;

    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        industries: (formData.profile.industries ?? []).filter(
          (i) => i !== industry,
        ),
      },
    });
  };
  const handleAddCertification = () => {
    if (!formData || !formData.profile) return;
    const trimmed = newCertification.trim();

    if (trimmed && !(formData.profile.certifications ?? []).includes(trimmed)) {
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          certifications: [...(formData.profile.certifications ?? []), trimmed],
        },
      });
      setNewCertification("");
    }
  };

  const handleRemoveCertification = (cert: string) => {
    if (!formData || !formData.profile) return;

    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        certifications: (formData.profile.certifications ?? []).filter(
          (c) => c !== cert,
        ),
      },
    });
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (loading) {
  return (
    <div className="space-y-6">

      {/* Cover skeleton */}
      <Skeleton className="h-64 w-full rounded-xl" />

      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>

      </div>
    </div>
  );
}
  if (!profileUser || !profileUser.profile) return <div>User not found</div>;

  const profile = profileUser.profile;
  const isOwnProfile = user?.id === profileUser.id;

  const computedStatus =
    profileUser.role === "EXPERT"
      ? (profileUser.computedStatus ?? "AVAILABLE")
      : null;
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
                       setUploading(true);
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
                    
                     } finally {
                       setUploading(false); 
  
                  }} }
                >
                  <Button
                    size="icon"
                    className="rounded-full bg-white shadow hover:bg-gray-100 transition"
                  >
                    {uploading ? (
    <LoadingSpinner size="sm" />
  ) : (
    <Camera className="size-4 text-gray-700" />
  )}
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

                setFormData(JSON.parse(JSON.stringify(profileUser)));
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
          {profileUser.role === "EXPERT" && computedStatus && (
            <Badge
              className={
                computedStatus === "AVAILABLE"
                  ? "bg-green-100 text-green-700"
                  : computedStatus === "BUSY"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }
            >
              <CheckCircle className="size-4" />
              {computedStatus}
            </Badge>
          )}
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
            <ExpertProfile profileUser={profileUser} />
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
              {profile.phone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {profile.phone}
                    </span>
                  </div>
                </div>
              )}
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
                    {profile.hourlyRate
                      ? `$${profile.hourlyRate}`
                      : "Not specified"}
                  </p>
                  <p className="text-gray-600">per hour</p>
                </div>
                {profileUser.role === "EXPERT" &&
                  (user?.id === profileUser.id ? (
                    // Expert viewing own profile
                    <Button
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => navigate("/app/expert/reservations")}
                    >
                      Manage Reservations
                    </Button>
                  ) : ["MEMBER", "ADMIN", "STARTUP"].includes(
                      user?.role || "",
                    ) ? (
                    // Other roles booking expert
                    <Button
                      disabled={computedStatus !== "AVAILABLE"}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      onClick={() =>
                        navigate(`/app/experts/${profileUser.id}/book`)
                      }
                    >
                      {computedStatus === "AVAILABLE"
                        ? "Book Consultation"
                        : "Currently Unavailable"}
                    </Button>
                  ) : null)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}

      <Dialog
        open={editModalOpen}
        onOpenChange={(open) => {
          if (!saving) setEditModalOpen(open);
        }}
      >
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
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label>Full Name </Label>
                      <Input
                        autoFocus={false}
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

                    {/* Location */}
                    <div className="space-y-2">
                      <Label>Location </Label>
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
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        placeholder="+216 55 123 456"
                        value={formData.profile?.phone ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile!,
                              phone: e.target.value,
                            },
                          })
                        }
                      />{" "}
                    </div>
                    {/* Bio */}
                    <div className="space-y-2">
                      <Label>Bio </Label>
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
                  </CardContent>
                </Card>

                {/* EXPERT SECTION */}
                {formData.role === "EXPERT" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Expert Information</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Top Grid Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Years of Experience */}
                        <div className="space-y-2">
                          <Label>Years of Experience *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.profile?.yearsOfExperience ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                profile: {
                                  ...formData.profile!,
                                  yearsOfExperience: Number(e.target.value),
                                },
                              })
                            }
                            required
                          />
                        </div>

                        {/* Availability Status */}
                        <div className="space-y-2">
                          <Label>Availability Status </Label>
                          <Select
                            value={
                              formData.profile?.availabilityStatus ??
                              "AVAILABLE"
                            }
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                profile: {
                                  ...formData.profile!,
                                  availabilityStatus: value as
                                    | "AVAILABLE"
                                    | "BUSY"
                                    | "ON_LEAVE",
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="AVAILABLE">
                                Available
                              </SelectItem>
                              <SelectItem value="BUSY">Busy</SelectItem>
                              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Hourly Rate */}
                      <div className="space-y-2">
                        <Label>Hourly Rate ($) </Label>
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
                      <TagInputSection
                        label="Areas of Expertise *"
                        items={formData.profile?.expertise || []}
                        newValue={newSkill}
                        setNewValue={setNewSkill}
                        onAdd={handleAddSkill}
                        onRemove={handleRemoveSkill}
                        emptyMessage="Please add at least one area of expertise"
                        variant="purple"
                      />

                      {/* Industries */}
                      <TagInputSection
                        label="Industries Covered *"
                        items={formData.profile?.industries || []}
                        newValue={newIndustry}
                        setNewValue={setNewIndustry}
                        onAdd={handleAddIndustry}
                        onRemove={handleRemoveIndustry}
                        emptyMessage="Please add at least one industry"
                        variant="blue"
                      />

                      {/* Certifications */}
                      <TagInputSection
                        label="Certifications *"
                        items={formData.profile?.certifications || []}
                        newValue={newCertification}
                        setNewValue={setNewCertification}
                        onAdd={handleAddCertification}
                        onRemove={handleRemoveCertification}
                        emptyMessage="Please add at least one certification"
                        variant="outline"
                      />

                      {/* Weekly Availability */}
                      <div className="space-y-2 pt-4 border-t">
                        <Label className="text-base font-semibold">
                          Weekly Availability
                        </Label>

                        <div className="space-y-4">
                          {dayNames.map((dayName, index) => {
                            const dayData =
                              formData.profile?.weeklyAvailability?.find(
                                (d) => d.day === index,
                              ) || {
                                day: index,
                                enabled: false,
                                startTime: "",
                                endTime: "",
                              };

                            const updateDay = (
                              updates: Partial<typeof dayData>,
                            ) => {
                              const existing =
                                formData.profile!.weeklyAvailability?.filter(
                                  (d) => d.day !== index,
                                ) || [];

                              const updated = [
                                ...existing,
                                { ...dayData, ...updates },
                              ].sort((a, b) => a.day - b.day);

                              setFormData({
                                ...formData,
                                profile: {
                                  ...formData.profile!,
                                  weeklyAvailability: updated,
                                },
                              });
                            };

                            return (
                              <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-gray-200 pb-4"
                              >
                                {/* Day */}
                                <p className="font-medium text-gray-900">
                                  {dayName}
                                </p>

                                {/* Start Time */}
                                <Input
                                  type="time"
                                  disabled={!dayData.enabled}
                                  value={dayData.startTime || ""}
                                  onChange={(e) =>
                                    updateDay({
                                      startTime: e.target.value,
                                    })
                                  }
                                />

                                {/* End Time */}
                                <Input
                                  type="time"
                                  disabled={!dayData.enabled}
                                  value={dayData.endTime || ""}
                                  onChange={(e) =>
                                    updateDay({
                                      endTime: e.target.value,
                                    })
                                  }
                                />

                                {/* Status */}
                                <Select
                                  value={
                                    dayData.enabled
                                      ? "available"
                                      : "unavailable"
                                  }
                                  onValueChange={(value) =>
                                    updateDay({
                                      enabled: value === "available",
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                      Available
                                    </SelectItem>
                                    <SelectItem value="unavailable">
                                      Unavailable
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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

              <DialogFooter className="flex flex-col sm:flex-row gap-2 items-center sm:items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="w-40"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 w-40"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
