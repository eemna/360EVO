import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../context/ToastContext";
import { z } from "zod";
import {
  X,
  Lightbulb,
  Box,
  Rocket,
  TrendingUp,
  ChevronRight,
  Plus,
  Trash2,
  Upload as UploadIcon,
  Check,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "../components/ui/fileUpload";
import { DocumentUpload } from "../components/ui/documentUpload";
import type { UploadedDocument } from "../components/ui/documentUpload";
import api from "../../services/axios";

interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string | null;
  onProjectSaved?: () => void; 
}

const STEPS = ["Basics", "Details", "Team", "Funding", "Media & Submit"];

const PROJECT_STAGES = [
  { value: "IDEA", label: "Ideation", icon: Lightbulb },
  { value: "PROTOTYPE", label: "Prototype", icon: Box },
  { value: "MVP", label: "MVP", icon: Rocket },
  { value: "GROWTH", label: "Growth", icon: TrendingUp },
  { value: "SCALING", label: "Scaling", icon: TrendingUp },
];

const INDUSTRIES = [
  "AI & Machine Learning",
  "Blockchain & Crypto",
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-Commerce",
  "SaaS",
  "IoT",
  "CleanTech",
  "AgriTech",
  "Cybersecurity",
  "PropTech",
];

const TECH_TAGS = [
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "AI/ML",
  "Blockchain",
  "Cloud",
  "Mobile",
  "IoT",
  "API",
  "TypeScript",
  "GraphQL",
  "Docker",
  "Kubernetes",
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "SGD", "JPY"];

// Zod validation schema
const projectSchema = z.object({
  // Step 1: Basics
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(60, "Title must be less than 60 characters"),
  tagline: z
    .string()
    .min(10, "Tagline must be at least 10 characters")
    .max(100, "Tagline must be less than 100 characters"),
  shortDescription: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  industry: z.string().min(1, "Please select an industry"),
  stage: z.string().min(1, "Please select a stage"),

  // Step 2: Details
  fullDescription: z
    .string()
    .min(50, "Full description must be at least 50 characters"),
  techTags: z.array(z.string()).min(1, "Select at least one technology"),

  // Step 3: Team
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(2, "Name is required"),
        role: z.string().min(2, "Role is required"),
        photo: z.string().nullable().optional(),
      }),
    )
    .min(1, "Add at least one team member"),

  // Step 4: Funding
  fundingAmount: z.string().min(1, "Funding amount is required"),
  currency: z.string().min(1, "Currency is required"),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2, "Milestone title is required"),
        targetDate: z.string().min(1, "Target date is required"),
        completedAt: z.string().optional().nullable(),
      }),
    )
    .min(1, "Add at least one milestone"),

  // Step 5: Media
  heroImage: z.any().optional(),
  documents: z.any().optional(),
  location: z.string().min(2, "Location is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type UploadedFile = {
  name: string;
  fileUrl: string;
  fileKey: string;
};
type ProjectDocument = {
  name: string;
  fileUrl: string;
  fileKey: string;
  fileType: "HERO_IMAGE" | "DOCUMENT";
};

type ApiProject = {
  id: string;
  title: string;
  tagline: string;
  shortDesc: string;
  fullDesc: string;
  industry: string;
  stage: string;
  technologies: string[];
  fundingSought: number | null;
  currency: string;

  teamMembers?: {
    name: string;
    role: string;
    photo?: string | null;
  }[];

  milestones?: {
    title: string;
    targetDate?: string | null;
    completedAt?: string | null;
  }[];
  documents?: ProjectDocument[];
};
export function ProjectCreationWizard({
  isOpen,
  onClose,
  projectId: externalProjectId,
  onProjectSaved,
}: ProjectCreationWizardProps) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  useEffect(() => {
  if (isOpen) {
    setCurrentProjectId(externalProjectId ?? null);
  }
}, [isOpen, externalProjectId]);
  const [currentStep, setCurrentStep] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track submission

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heroFile, setHeroFile] = useState<UploadedFile | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<UploadedDocument[]>([]);
  const { showToast } = useToast();
  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors },
    trigger,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      tagline: "",
      shortDescription: "",
      industry: "",
      stage: "",
      fullDescription: "",
      techTags: [],
      teamMembers: [{ name: "", role: "", photo: null }],
      fundingAmount: "",
      currency: "USD",
      location: "",
      milestones: [{ title: "", targetDate: "", completedAt: "" }],
    },
  });
  const title = watch("title");
  const tagline = watch("tagline");
  const shortDescription = watch("shortDescription");
  const industry = watch("industry");
  const stage = watch("stage");
  const techTags = watch("techTags");
  const teamMembers = watch("teamMembers");
  const fundingAmount = watch("fundingAmount");
  const currency = watch("currency");

  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({
    control,
    name: "teamMembers",
  });

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control,
    name: "milestones",
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof ProjectFormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = [
          "title",
          "tagline",
          "shortDescription",
          "industry",
          "stage",
          "location",
        ];
        break;
      case 1:
        fieldsToValidate = ["fullDescription", "techTags"];
        break;
      case 2:
        fieldsToValidate = ["teamMembers"];
        break;
      case 3:
        fieldsToValidate = ["fundingAmount", "currency", "milestones"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const mapFormToApi = useCallback(
    (values: ProjectFormData) => ({
      title: values.title,
      tagline: values.tagline,
      shortDesc: values.shortDescription,
      fullDesc: values.fullDescription,
      stage: values.stage,
      industry: values.industry,
      technologies: values.techTags,
      location: values.location,
      fundingSought: values.fundingAmount ? Number(values.fundingAmount) : null,
      currency: values.currency,

      teamMembers: values.teamMembers.map((member) => ({
        name: member.name,
        role: member.role,
        photo: member.photo ?? null,
      })),

      milestones: values.milestones.map((milestone, index) => ({
        title: milestone.title,
        description: milestone.title,
        targetDate: milestone.targetDate
          ? new Date(milestone.targetDate)
          : null,
        completedAt: milestone.completedAt
          ? new Date(milestone.completedAt)
          : null,
        order: index,
      })),

      documents: [
        ...(heroFile
          ? [
              {
                name: "Hero Image",
                fileUrl: heroFile.fileUrl,
                fileKey: heroFile.fileKey,
                fileType: "HERO_IMAGE",
              },
            ]
          : []),

        ...supportingDocs.map((file) => ({
          name: file.name,
          fileUrl: file.fileUrl,
          fileKey: file.fileKey,
          fileType: "DOCUMENT",
        })),
      ],
    }),
    [heroFile, supportingDocs],
  );

  const onSubmit = async (data: ProjectFormData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsSubmitting(true);

    try {
      setSaveStatus("saving");

      const payload = mapFormToApi(data);

      let id = currentProjectId;

      if (!id) {
        // First time → create project
        const res = await api.post("/projects", payload);
      
        id = res.data.id;
        setCurrentProjectId(id);
      } else {
        //  Update existing draft
        await api.put(`/projects/${id}`, payload);
        
      }

      // Submit project
      await api.post(`/projects/${id}/submit`);
           if (onProjectSaved) {
      await onProjectSaved();
    }
      setSaveStatus("saved");
      showToast({
        type: "success",
        title: "Project submitted successfully!",
        message: "Your project has been sent for review.",
      });
      onClose();
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      showToast({
        type: "error",
        title: "Submission failed",
        message: "Something went wrong while submitting the project.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleNewProject = () => {
    setCurrentProjectId(null); 
    setCurrentStep(0);

    reset({
      title: "",
      tagline: "",
      shortDescription: "",
      industry: "",
      stage: "",
      fullDescription: "",
      techTags: [],
      teamMembers: [{ name: "", role: "", photo: null }],
      fundingAmount: "",
      currency: "USD",
      milestones: [{ title: "", targetDate: "", completedAt: "" }],
    });

    setHeroFile(null);
    setSupportingDocs([]);
  };
  const toggleTechTag = (tag: string) => {
    const currentTags = techTags || [];
    if (currentTags.includes(tag)) {
      setValue(
        "techTags",
        currentTags.filter((t) => t !== tag),
      );
    } else {
      setValue("techTags", [...currentTags, tag]);
    }
  };
const handleClose = () => {
  handleNewProject();
  onClose();
};
  const saveDraft = async () => {
    if (isSubmitting) return;

    try {
      setSaveStatus("saving");

      const payload = mapFormToApi(getValues());

      let id = currentProjectId;

      if (!id) {
        //  First time → create draft
        const res = await api.post("/projects", payload);
        if (onProjectSaved) {
  await onProjectSaved();
}
        id = res.data.id;
        setCurrentProjectId(id);
      } else {
        //  Existing draft → update
        await api.put(`/projects/${id}`, payload);
        if (onProjectSaved) {
  await onProjectSaved();
}
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      showToast({
        type: "success",
        title: "Draft saved",
        message: "Your project draft was saved successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      showToast({
        type: "error",
        title: "Draft save failed",
        message: "Could not save draft. Please try again.",
      });
    }
  };
  /*useEffect(() => {
  if (isOpen) {
    setProjectId(externalProjectId ?? null);
  }
}, [isOpen, externalProjectId]); */
  useEffect(() => {
  if (isOpen && !externalProjectId) {
    reset({
      title: "",
      tagline: "",
      shortDescription: "",
      industry: "",
      stage: "",
      fullDescription: "",
      techTags: [],
      teamMembers: [{ name: "", role: "", photo: null }],
      fundingAmount: "",
      currency: "USD",
      milestones: [{ title: "", targetDate: "", completedAt: "" }],
    });

    setHeroFile(null);
    setSupportingDocs([]);
  }
}, [isOpen, externalProjectId, reset]);
useEffect(() => {
  if (!isOpen || !externalProjectId) return;

  const loadProject = async () => {
    try {
      const res = await api.get<ApiProject>(`/projects/${externalProjectId}`);
      const project = res.data;

      reset({
        title: project.title,
        tagline: project.tagline,
        shortDescription: project.shortDesc,
        industry: project.industry,
        stage: project.stage,
        fullDescription: project.fullDesc,
        techTags: project.technologies || [],
        teamMembers:
          project.teamMembers?.map((m) => ({
            name: m.name,
            role: m.role,
            photo: m.photo || null,
          })) || [{ name: "", role: "", photo: null }],
        fundingAmount: project.fundingSought?.toString() || "",
        currency: project.currency || "USD",
        milestones:
          project.milestones?.map((m) => ({
            title: m.title,
            targetDate: m.targetDate
              ? new Date(m.targetDate).toISOString().split("T")[0]
              : "",
            completedAt: m.completedAt
              ? new Date(m.completedAt).toISOString().split("T")[0]
              : "",
          })) || [],
      });

      const hero = project.documents?.find(
        (doc) => doc.fileType === "HERO_IMAGE"
      );

      setHeroFile(
        hero
          ? {
              name: hero.name,
              fileUrl: hero.fileUrl,
              fileKey: hero.fileKey,
            }
          : null
      );

      setSupportingDocs(
        project.documents
          ?.filter((doc) => doc.fileType === "DOCUMENT")
          .map((doc) => ({
            name: doc.name,
            fileUrl: doc.fileUrl,
            fileKey: doc.fileKey,
          })) || []
      );
    } catch (error) {
      console.error("Failed to load project", error);
    }
  };

  loadProject();
}, [isOpen, externalProjectId, reset]);

 /* const loadProject = async () => {
    try {
      const res = await api.get<ApiProject>(`/projects/${projectId}`);
const project = res.data;

      // 1️⃣ Reset form fields
      reset({
        title: project.title,
        tagline: project.tagline,
        shortDescription: project.shortDesc,
        industry: project.industry,
        stage: project.stage,
        fullDescription: project.fullDesc,
        techTags: project.technologies || [],
        teamMembers:
  project.teamMembers?.map((m) => ({
    name: m.name,
    role: m.role,
    photo: m.photo || null,
  })) || [{ name: "", role: "", photo: null }],
        fundingAmount: project.fundingSought?.toString() || "",
        currency: project.currency || "USD",
        milestones:
          project.milestones?.map((m) => ({
            title: m.title,
            targetDate: m.targetDate
              ? new Date(m.targetDate).toISOString().split("T")[0]
              : "",
            completedAt: m.completedAt
              ? new Date(m.completedAt).toISOString().split("T")[0]
              : "",
          })) || [],
      });

      // 2️⃣ Restore HERO image (OUTSIDE reset)
      const hero = project.documents?.find(
        (doc: ProjectDocument) => doc.fileType === "HERO_IMAGE"
      );

      if (hero) {
        setHeroFile({
          name: hero.name,
          fileUrl: hero.fileUrl,
          fileKey: hero.fileKey,
        });
      } else {
        setHeroFile(null);
      }

      // 3️⃣ Restore supporting docs (OUTSIDE reset)
      const docs =
        project.documents?.filter(
          (doc) => doc.fileType === "DOCUMENT"
        ) || [];

      setSupportingDocs(
  docs.map((doc) => ({
    name: doc.name,
    fileUrl: doc.fileUrl,
    fileKey: doc.fileKey,
    
  }))
);
    } catch (error) {
      console.error("Failed to load project", error);
    }
  };

  loadProject();
}, [isOpen, projectId, reset]);  */





 useEffect(() => {
  if (!isOpen) return;
  if (!currentProjectId) return;
  if (isSubmitting) return;

  const subscription = watch(() => {
    const values = getValues();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (isSubmitting) return;

      try {
        setSaveStatus("saving");

        await api.put(
          `/projects/${currentProjectId}`,
          mapFormToApi(values)
        );

        setSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setSaveStatus("error");
      }
    }, 60000);
  });

  return () => {
    subscription.unsubscribe();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  }, [currentProjectId, isSubmitting, isOpen, watch, getValues, mapFormToApi]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-50 w-full max-w-7xl max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">
              {currentProjectId ? "Edit Project" : "Create New Project"}
            </h2>
            {saveStatus === "saving" && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}

            {saveStatus === "saved" && (
              <span className="text-sm text-green-600">✓ Saved</span>
            )}

            {saveStatus === "error" && (
              <span className="text-sm text-red-600">Error saving</span>
            )}
          </div>

          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="bg-gray-100 hover:bg-gray-200 shadow-none transition-colors"
          >
            <X className="size-4 text-red-500 " />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="border-b border-gray-300 px-8 py-4">
          <div className="flex items-center justify-between mb-2 ">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      index < currentStep
                        ? "bg-green-600 text-white"
                        : index === currentStep
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      index <= currentStep ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                    <div
                      className={`h-full transition-all ${
                        index < currentStep ? "bg-green-600" : "bg-transparent"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="px-8 py-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Left Column - Form Fields */}
              <div className="col-span-2 space-y-6">
                {/* STEP 1: BASICS */}
                {currentStep === 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Project Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="Enter your project name"
                        maxLength={60}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-600">
                          {errors.title.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {title?.length || 0}/60
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">
                        Tagline <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="tagline"
                        {...register("tagline")}
                        placeholder="A catchy one-liner"
                        maxLength={100}
                      />
                      {errors.tagline && (
                        <p className="text-sm text-red-600">
                          {errors.tagline.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {tagline?.length || 0}/100
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">
                        Short Description{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="shortDescription"
                        {...register("shortDescription")}
                        placeholder="Describe your project in 2-3 sentences"
                        maxLength={500}
                        rows={4}
                      />
                      {errors.shortDescription && (
                        <p className="text-sm text-red-600">
                          {errors.shortDescription.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {shortDescription?.length || 0}/500
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Industry <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="industry"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.industry && (
                        <p className="text-sm text-red-600">
                          {errors.industry.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
  <Label>
    Location <span className="text-red-500">*</span>
  </Label>
  <Input
    {...register("location")}
    placeholder="e.g., Tunis, Tunisia"
  />
  {errors.location && (
    <p className="text-sm text-red-600">
      {errors.location.message}
    </p>
  )}
</div>
                    <div className="space-y-3">
                      <Label>
                        Project Stage <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-5 gap-3">
                        {PROJECT_STAGES.map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue("stage", value)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              stage === value
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <Icon
                              className={`size-6 mx-auto mb-2 ${
                                stage === value
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <div
                              className={`text-sm font-medium ${
                                stage === value
                                  ? "text-blue-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {label}
                            </div>
                          </button>
                        ))}
                      </div>
                      {errors.stage && (
                        <p className="text-sm text-red-600">
                          {errors.stage.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* STEP 2: DETAILS */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        Full Description <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="fullDescription"
                        control={control}
                        render={({ field }) => (
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Provide a detailed description of your project, including the problem you're solving, your solution, target market, and unique value proposition..."
                            minHeight="300px"
                          />
                        )}
                      />
                      {errors.fullDescription && (
                        <p className="text-sm text-red-600">
                          {errors.fullDescription.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>
                        Technology Tags <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {TECH_TAGS.map((tag) => (
                          <Badge
                            key={tag}
                            onClick={() => toggleTechTag(tag)}
                            className={`cursor-pointer px-4 py-2 text-sm ${
                              techTags?.includes(tag)
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {errors.techTags && (
                        <p className="text-sm text-red-600">
                          {errors.techTags.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Selected: {techTags?.length || 0}
                      </p>
                    </div>
                  </>
                )}

                {/* STEP 3: TEAM */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>
                        Team Members <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        onClick={() =>
                          appendTeam({ name: "", role: "", photo: null })
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="size-4 mr-2" />
                        Add Member
                      </Button>
                    </div>

                    {teamFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                              <UserIcon className="size-4" />
                              Member {index + 1}
                            </h4>
                            {teamFields.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeTeam(index)}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                {...register(`teamMembers.${index}.name`)}
                                placeholder="Full name"
                              />
                              {errors.teamMembers?.[index]?.name && (
                                <p className="text-sm text-red-600">
                                  {errors.teamMembers[index]?.name?.message}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Input
                                {...register(`teamMembers.${index}.role`)}
                                placeholder="e.g., CEO, CTO"
                              />
                              {errors.teamMembers?.[index]?.role && (
                                <p className="text-sm text-red-600">
                                  {errors.teamMembers[index]?.role?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Photo (Optional)</Label>
                            <FileUpload
  accept="image/*"
  maxSize={5}
  label=""
  description="Upload member photo"
  existingFileUrl={
  watch(`teamMembers.${index}.photo`) || undefined
}
  onFileSelect={(file) => {
    if (!file) {
      setValue(`teamMembers.${index}.photo`, null);
      return;
    }

    setValue(`teamMembers.${index}.photo`, file.url);
  }}
/>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {errors.teamMembers &&
                      typeof errors.teamMembers.message === "string" && (
                        <p className="text-sm text-red-600">
                          {errors.teamMembers.message}
                        </p>
                      )}
                  </div>
                )}

                {/* STEP 4: FUNDING */}
                {currentStep === 3 && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Funding Amount <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          {...register("fundingAmount")}
                          type="number"
                          placeholder="e.g., 100000"
                        />
                        {errors.fundingAmount && (
                          <p className="text-sm text-red-600">
                            {errors.fundingAmount.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Currency <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="currency"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CURRENCIES.map((currency) => (
                                  <SelectItem key={currency} value={currency}>
                                    {currency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>
                          Milestones <span className="text-red-500">*</span>
                        </Label>
                        <Button
                          type="button"
                          onClick={() =>
                            appendMilestone({
                              title: "",
                              targetDate: "",
                              completedAt: "",
                            })
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="size-4 mr-2" />
                          Add Milestone
                        </Button>
                      </div>

                      {milestoneFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                Milestone {index + 1}
                              </h4>
                              {milestoneFields.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeMilestone(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                  {...register(`milestones.${index}.title`)}
                                  placeholder="Milestone description"
                                />
                                {errors.milestones?.[index]?.title && (
                                  <p className="text-sm text-red-600">
                                    {errors.milestones[index]?.title?.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Target Date</Label>
                                <Input
                                  {...register(
                                    `milestones.${index}.targetDate`,
                                  )}
                                  type="date"
                                />
                                {errors.milestones?.[index]?.targetDate && (
                                  <p className="text-sm text-red-600">
                                    {
                                      errors.milestones[index]?.targetDate
                                        ?.message
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* STEP 5: MEDIA & SUBMIT */}
                {currentStep === 4 && (
                  <>
                    {/* HERO IMAGE */}
                    <div className="space-y-2">
                      <Label>Hero Image</Label>
                      <FileUpload
  accept="image/*"
  maxSize={5}
  label=""
  description="Upload a cover image for your project"
  existingFileUrl={heroFile?.fileUrl}   
  onFileSelect={(file) => {
    if (!file) {
      setHeroFile(null);
      return;
    }

    setHeroFile({
      name: "Hero Image",
      fileUrl: file.url,
      fileKey: file.publicId,
    });
  }}
/>
                    </div>

                    {/* SUPPORTING DOCUMENTS */}
                    <div className="space-y-2">
                      <Label>Supporting Documents</Label>
                      <DocumentUpload
                        label=""
                        description="Upload pitch decks, business plans, or other documents"
                        maxFiles={5}
                        maxSize={10}
                        acceptedTypes={[
                          ".pdf",
                          ".doc",
                          ".docx",
                          ".ppt",
                          ".pptx",
                        ]}
                        initialFiles={supportingDocs}
                        onFilesChange={(files) => {
                          setSupportingDocs(files);
                        }}
                      />
                    </div>

                    {/* REVIEW SUMMARY */}
                    <Card className="p-6 bg-blue-50 border-gray-300">
                      <h3 className="font-semibold mb-4">
                        Review Your Project
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium">Title:</span>{" "}
                          {title || "Not set"}
                        </div>
                        <div>
                          <span className="font-medium">Industry:</span>{" "}
                          {industry || "Not set"}
                        </div>
                        <div>
                          <span className="font-medium">Stage:</span>{" "}
                          {PROJECT_STAGES.find((s) => s.value === stage)
                            ?.label || "Not set"}
                        </div>
                        <div>
                          <span className="font-medium">Team Members:</span>{" "}
                          {teamMembers?.length || 0}
                        </div>
                        <div>
                          <span className="font-medium">Funding:</span>{" "}
                          {currency} {fundingAmount || "0"}
                        </div>
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Right Column - Preview & Tips */}
              <div className="space-y-6">
                <Card className="p-6 bg-blue-50 border-blue-200 sticky top-0">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="size-5 text-blue-600" />
                    Tips for Step {currentStep + 1}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {currentStep === 0 && (
                      <>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            Choose a memorable and descriptive project name
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            Your tagline should explain what you do in one
                            sentence
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            Be honest about your current project stage
                          </span>
                        </li>
                      </>
                    )}
                    {currentStep === 1 && (
                      <>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            Use formatting to make your description easy to read
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            Include problem, solution, and target market
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Select 3-5 core technologies</span>
                        </li>
                      </>
                    )}
                    {currentStep === 2 && (
                      <>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Include key team members and their roles</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Photos help build trust with investors</span>
                        </li>
                      </>
                    )}
                    {currentStep === 3 && (
                      <>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Be transparent about funding needs</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Set realistic milestone dates</span>
                        </li>
                      </>
                    )}
                    {currentStep === 4 && (
                      <>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            A great hero image makes your project stand out
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Review all information before submitting</span>
                        </li>
                      </>
                    )}
                  </ul>
                </Card>

                <Card className="p-4 bg-gray-50 border border-gray-300">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Progress</span>
                    <span className="text-gray-600">
                      {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                      }}
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleNewProject}
              >
                New Project
              </Button>
              <Button type="button" variant="outline" onClick={saveDraft}>
                <UploadIcon className="size-4 mr-2" />
                Save Draft
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <Button type="button" onClick={handleSubmit(onSubmit)}>
                  {currentProjectId ? "Update Project" : "Create Project"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
