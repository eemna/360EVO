import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../../context/ToastContext";
//import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/axios";
import {
  FileText,
  File,
  Upload,
  Trash2,
  Send,
  Bot,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Activity,
  MessageSquare,
  Wand2,
  Sparkles,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  FileBarChart,
  Eye,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataRoomDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  accessLevel: "OPEN" | "ON_REQUEST";
  textExtract: string | null;
  uploadedAt: string;
}

interface QaResponse {
  id: string;
  body: string;
  isAiGenerated: boolean;
  createdAt: string;
  responder: { name: string; role: string };
}

interface QaThread {
  id: string;
  question: string;
  aiSuggestedAnswer: string | null;
  createdAt: string;
  asker: { name: string; role: string };
  responses: QaResponse[];
}

interface ActivityItem {
  id: string;
  action: string;
  docName: string | null;
  createdAt: string;
  user: { name: string };
}

interface RiskScan {
  riskFlags: string[];
  highlights: string[];
  overallRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
}

interface DataRoom {
  id: string;
  projectId: string;
  investorId: string;
  expiresAt: string;
  aiSummaryGenerated: boolean;
  isInvestor: boolean;
  isOwner: boolean;
  project: { title: string; ownerId: string };
  documents: DataRoomDocument[];
  qaThreads: QaThread[];
  activity: ActivityItem[];
  dealBrief: { id: string } | null;
}

// ─── Helper Components ─────────────────────────────────────────────────────────

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [now] = useState(() => Date.now());

  const diff = new Date(expiresAt).getTime() - now;
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const urgent = days <= 3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        urgent
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-green-50 text-green-700 border-green-200"
      }`}
    >
      <Clock className="size-3" />
      {days === 0 ? "Expires today" : `${days}d remaining`}
    </span>
  );
}

function RiskBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const cfg = {
    LOW: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: ShieldCheck,
    },
    MEDIUM: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: ShieldAlert,
    },
    HIGH: {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: AlertTriangle,
    },
  }[level];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}
    >
      <Icon className="size-3" />
      {level} RISK
    </span>
  );
}

function getFileIcon(fileType: string) {
  if (fileType === "application/pdf")
    return <FileText className="size-4 text-red-500 flex-shrink-0" />;
  return <File className="size-4 text-blue-500 flex-shrink-0" />;
}

const ACTION_LABELS: Record<string, string> = {
  VIEWED_ROOM: "Viewed the data room",
  UPLOADED_DOCUMENT: "Uploaded a document",
  DELETED_DOCUMENT: "Deleted a document",
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DataRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  //const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();

  const [dataRoom, setDataRoom] = useState<DataRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "qa" | "activity">(
    "documents",
  );
  const [riskScan, setRiskScan] = useState<RiskScan | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [riskExpanded, setRiskExpanded] = useState(true);

  // Upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Q&A state
  const [newQuestion, setNewQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [qaThreads, setQaThreads] = useState<QaThread[]>([]);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState<string | null>(null);

  const fetchDataRoom = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/data-rooms/${id}`);
      setDataRoom(data);
      setQaThreads(data.qaThreads || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load data room";
      showToast({ type: "error", title: "Error", message: msg });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchDataRoom();
  }, [fetchDataRoom]);

  // Socket.io real-time Q&A
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join_dataroom", id);

    socket.on("new_qa_thread", (thread: QaThread) => {
      setQaThreads((prev) => [thread, ...prev]);
    });

    socket.on(
      "new_qa_response",
      ({ threadId, response }: { threadId: string; response: QaResponse }) => {
        setQaThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? { ...t, responses: [...t.responses, response] }
              : t,
          ),
        );
      },
    );

    return () => {
      socket.emit("leave_dataroom", id);
      socket.off("new_qa_thread");
      socket.off("new_qa_response");
    };
  }, [socket, id]);

  // Auto-trigger AI scan when investor opens for first time
  useEffect(() => {
    if (!dataRoom || !dataRoom.isInvestor) return;
    if (dataRoom.documents.length === 0) return;
    runAiScan(true); // silent = true, don't show toast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRoom?.id]);

  const runAiScan = async (silent = false) => {
    try {
      setScanLoading(true);
      const { data } = await api.post(`/data-rooms/${id}/ai/scan`);
      setRiskScan(data.data);
      if (!silent)
        showToast({ type: "success", title: "AI scan complete", message: "" });
    } catch {
      if (!silent)
        showToast({
          type: "error",
          title: "Scan failed",
          message: "Try again.",
        });
    } finally {
      setScanLoading(false);
    }
  };

  // ── Document upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dataRoom) return;

    try {
      setUploadingDoc(true);

      // Step 1: upload to Cloudinary via existing endpoint
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/uploads/document", formData);

      // Step 2: save to data room (PDF text extraction happens here)
      await api.post(`/data-rooms/${id}/documents`, {
        name: file.name,
        fileUrl: uploadRes.data.url,
        fileKey: uploadRes.data.publicId,
        fileType: file.type,
        accessLevel: "OPEN",
      });

      showToast({ type: "success", title: "Document uploaded", message: "" });
      await fetchDataRoom();
    } catch {
      showToast({
        type: "error",
        title: "Upload failed",
        message: "Try again.",
      });
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.delete(`/data-rooms/${id}/documents/${docId}`);
      showToast({ type: "success", title: "Document deleted", message: "" });
      await fetchDataRoom();
    } catch {
      showToast({ type: "error", title: "Delete failed", message: "" });
    }
  };

  const handleAccessLevelChange = async (
    docId: string,
    accessLevel: string,
  ) => {
    try {
      await api.put(`/data-rooms/${id}/documents/${docId}`, { accessLevel });
      await fetchDataRoom();
    } catch {
      showToast({ type: "error", title: "Update failed", message: "" });
    }
  };

  // ── Q&A ──────────────────────────────────────────────────────────────────────
  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    try {
      setAskingQuestion(true);
      await api.post(`/data-rooms/${id}/qa`, { question: newQuestion });
      setNewQuestion("");
      showToast({
        type: "success",
        title: "Question sent",
        message: "The startup will be notified.",
      });
    } catch {
      showToast({
        type: "error",
        title: "Failed to send question",
        message: "",
      });
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleGetAiSuggestion = async (threadId: string) => {
    try {
      setAiSuggesting(threadId);
      const { data } = await api.post(`/data-rooms/${id}/ai/suggest-answer`, {
        threadId,
      });

      setQaThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, aiSuggestedAnswer: data.suggestedAnswer }
            : t,
        ),
      );

      // Pre-fill the reply box with the suggestion
      setReplyText(data.suggestedAnswer);
      setExpandedThread(threadId);

      showToast({
        type: "success",
        title: "AI suggestion ready",
        message: "Review and edit before sending.",
      });
    } catch {
      showToast({ type: "error", title: "AI suggestion failed", message: "" });
    } finally {
      setAiSuggesting(null);
    }
  };

  const handleReply = async (threadId: string) => {
    if (!replyText.trim()) return;
    try {
      setReplying(threadId);
      await api.post(`/data-rooms/${id}/qa/${threadId}/reply`, {
        body: replyText,
        isAiGenerated: false,
      });
      setReplyText("");
      setExpandedThread(null);
      showToast({ type: "success", title: "Reply sent", message: "" });
    } catch {
      showToast({ type: "error", title: "Reply failed", message: "" });
    } finally {
      setReplying(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!dataRoom) return null;

  const { isInvestor, isOwner } = dataRoom;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="size-5 text-indigo-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              {dataRoom.project.title} — Data Room
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExpiryCountdown expiresAt={dataRoom.expiresAt} />
            <span className="text-xs text-gray-400">
              {dataRoom.documents.length} document
              {dataRoom.documents.length !== 1 ? "s" : ""}
            </span>
            <Badge
              className={
                isInvestor
                  ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                  : "bg-green-100 text-green-700 border-green-200"
              }
            >
              {isInvestor ? "Investor View" : "Startup View"}
            </Badge>
          </div>
        </div>

        {/* Deal Brief button — investor only */}
        {isInvestor && (
          <Button
            onClick={() =>
              navigate(`/app/investor/data-rooms/${id}/deal-brief`)
            }
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <FileBarChart className="size-4" />
            {dataRoom.dealBrief ? "View Deal Brief" : "Generate Deal Brief"}
          </Button>
        )}
      </div>

      {/* ── AI Risk Scan Panel (investor only) ── */}
      {isInvestor && (
        <Card className="border border-gray-200 overflow-hidden">
          <button
            onClick={() => setRiskExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-800">
                AI Document Analysis
              </span>
              {riskScan && <RiskBadge level={riskScan.overallRiskLevel} />}
              {scanLoading && (
                <LoadingSpinner size="sm" className="text-indigo-600" />
              )}
            </div>
            {riskExpanded ? (
              <ChevronDown className="size-4 text-gray-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400" />
            )}
          </button>

          {riskExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100">
              {!riskScan && !scanLoading && (
                <div className="py-6 text-center">
                  <Bot className="size-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">
                    {dataRoom.documents.length === 0
                      ? "Upload documents to run the AI analysis"
                      : "Click scan to analyse all uploaded documents"}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => runAiScan()}
                    disabled={dataRoom.documents.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                  >
                    <Sparkles className="size-4" />
                    Run AI Scan
                  </Button>
                </div>
              )}

              {scanLoading && !riskScan && (
                <div className="py-8 flex flex-col items-center gap-3">
                  <LoadingSpinner size="lg" className="text-indigo-600" />
                  <p className="text-sm text-gray-500">
                    Analysing documents...
                  </p>
                </div>
              )}

              {riskScan && (
                <div className="pt-4 space-y-4">
                  {/* Summary */}
                  <p className="text-sm text-gray-600 leading-relaxed border-l-4 border-indigo-300 pl-3">
                    {riskScan.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Risk Flags */}
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Risk Flags (
                        {riskScan.riskFlags.length})
                      </p>
                      <div className="space-y-1.5">
                        {riskScan.riskFlags.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">
                            No flags identified
                          </p>
                        ) : (
                          riskScan.riskFlags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-600">{flag}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Positive Signals (
                        {riskScan.highlights.length})
                      </p>
                      <div className="space-y-1.5">
                        {riskScan.highlights.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">
                            None identified
                          </p>
                        ) : (
                          riskScan.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-600">{h}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runAiScan()}
                    disabled={scanLoading}
                    className="text-xs gap-1"
                  >
                    <RefreshCw className="size-3" />
                    Re-scan
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Documents ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab nav */}
          <div className="flex items-center gap-1 border-b border-gray-200">
            {[
              { key: "documents", label: "Documents", icon: FolderOpen },
              {
                key: "qa",
                label: `Q&A (${qaThreads.length})`,
                icon: MessageSquare,
              },
              { key: "activity", label: "Activity", icon: Activity },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Documents Tab ── */}
          {activeTab === "documents" && (
            <div className="space-y-3">
              {/* Upload button — owner only */}
              {isOwner && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    aria-label="Upload document"
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDoc}
                    variant="outline"
                    className="gap-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    {uploadingDoc ? (
                      <LoadingSpinner size="sm" className="text-indigo-600" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {uploadingDoc
                      ? "Uploading & extracting text..."
                      : "Upload Document"}
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF text is automatically extracted for AI analysis
                  </p>
                </div>
              )}

              {dataRoom.documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <FolderOpen className="size-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {isOwner
                      ? "No documents yet. Upload confidential files for the investor."
                      : "The startup hasn't uploaded any documents yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(dataRoom.documents ?? []).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow group"
                    >
                      {getFileIcon(doc.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                          {doc.textExtract ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                              <CheckCircle2 className="size-2.5" />
                              AI-ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                              <Info className="size-2.5" />
                              No text extract
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Access level toggle — owner only */}
                        {isOwner && (
                          <Select
                            value={doc.accessLevel}
                            onValueChange={(v) =>
                              handleAccessLevelChange(doc.id, v)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">
                                <span className="flex items-center gap-1.5">
                                  <Globe className="size-3" /> Open
                                </span>
                              </SelectItem>
                              <SelectItem value="ON_REQUEST">
                                <span className="flex items-center gap-1.5">
                                  <Lock className="size-3" /> On Request
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                          >
                            <Eye className="size-3.5 text-gray-500" />
                          </Button>
                        </a>

                        <a href={doc.fileUrl} download={doc.name}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                          >
                            <Download className="size-3.5 text-gray-500" />
                          </Button>
                        </a>

                        {isOwner && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => handleDeleteDoc(doc.id)}
                          >
                            <Trash2 className="size-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>

                      {/* Access badge — always visible */}
                      <span
                        className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                          doc.accessLevel === "OPEN"
                            ? "bg-green-50 text-green-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {doc.accessLevel === "OPEN" ? (
                          <Globe className="size-2.5" />
                        ) : (
                          <Lock className="size-2.5" />
                        )}
                        {doc.accessLevel === "OPEN" ? "Open" : "On Request"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Q&A Tab ── */}
          {activeTab === "qa" && (
            <div className="space-y-4">
              {/* Ask question — investor only */}
              {isInvestor && (
                <Card className="border border-indigo-100 bg-indigo-50/40">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Ask a question
                    </p>
                    <Textarea
                      placeholder="e.g., What is your current MRR? Can you share the cap table?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAskQuestion}
                        disabled={askingQuestion || !newQuestion.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                      >
                        {askingQuestion ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        Send Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Threads */}
              {qaThreads.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <MessageSquare className="size-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No questions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(qaThreads ?? []).map((thread) => {
                    const isExpanded = expandedThread === thread.id;
                    const hasReplies = thread.responses.length > 0;
                    const hasSuggestion = !!thread.aiSuggestedAnswer;

                    return (
                      <Card key={thread.id} className="border border-gray-200">
                        <CardContent className="pt-4 pb-4">
                          {/* Question */}
                          <div className="flex items-start gap-2 mb-3">
                            <div className="size-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">
                              Q
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {thread.question}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {thread.asker.name} ·{" "}
                                {new Date(
                                  thread.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            {hasSuggestion && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 flex-shrink-0">
                                <Bot className="size-2.5" />
                                AI draft
                              </span>
                            )}
                          </div>

                          {/* Replies */}
                          {(thread.responses ?? []).map((resp) => (
                            <div
                              key={resp.id}
                              className="flex items-start gap-2 ml-4 mb-2 pl-3 border-l-2 border-gray-200"
                            >
                              <div
                                className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                  resp.isAiGenerated
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {resp.isAiGenerated ? (
                                  <Bot className="size-3" />
                                ) : (
                                  "A"
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                  {resp.body}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {resp.responder.name}
                                  {resp.isAiGenerated && " (AI-assisted)"}
                                  {" · "}
                                  {new Date(
                                    resp.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Startup reply area */}
                          {isOwner && !hasReplies && (
                            <div className="mt-2 space-y-2">
                              {/* AI Suggest button */}
                              {!isExpanded && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleGetAiSuggestion(thread.id)
                                    }
                                    disabled={aiSuggesting === thread.id}
                                    className="text-xs gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                  >
                                    {aiSuggesting === thread.id ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      <Wand2 className="size-3" />
                                    )}
                                    AI Suggest Answer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setExpandedThread(thread.id);
                                      if (thread.aiSuggestedAnswer) {
                                        setReplyText(thread.aiSuggestedAnswer);
                                      }
                                    }}
                                    className="text-xs gap-1"
                                  >
                                    <Send className="size-3" />
                                    Reply
                                  </Button>
                                </div>
                              )}

                              {isExpanded && (
                                <div className="space-y-2">
                                  {thread.aiSuggestedAnswer && (
                                    <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                                      <Bot className="size-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-indigo-700 mb-1">
                                          AI Suggested Answer — review and edit
                                          before sending
                                        </p>
                                        <p className="text-xs text-indigo-600">
                                          {thread.aiSuggestedAnswer}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  <Textarea
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(e.target.value)
                                    }
                                    rows={3}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setExpandedThread(null);
                                        setReplyText("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleReply(thread.id)}
                                      disabled={
                                        replying === thread.id ||
                                        !replyText.trim()
                                      }
                                      className="bg-green-600 hover:bg-green-700 gap-1"
                                    >
                                      {replying === thread.id ? (
                                        <LoadingSpinner size="sm" />
                                      ) : (
                                        <Send className="size-3" />
                                      )}
                                      Send Reply
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === "activity" && (
            <div className="space-y-2">
              {dataRoom.activity.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Activity className="size-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No activity yet.</p>
                </div>
              ) : (
                dataRoom.activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg"
                  >
                    <div className="size-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">{item.user.name}</span>{" "}
                        {ACTION_LABELS[item.action] || item.action}
                        {item.docName && (
                          <span className="text-gray-500">
                            {" "}
                            — {item.docName}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-4">
          {/* Data room info */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Data Room Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Documents</span>
                <span className="font-medium">{dataRoom.documents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Questions</span>
                <span className="font-medium">{qaThreads.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expires</span>
                <span className="font-medium text-xs">
                  {new Date(dataRoom.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">AI Scanned</span>
                <span
                  className={`text-xs font-medium ${dataRoom.aiSummaryGenerated ? "text-green-600" : "text-gray-400"}`}
                >
                  {dataRoom.aiSummaryGenerated ? "Yes" : "Not yet"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Deal Brief card — investor only */}
          {isInvestor && (
            <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileBarChart className="size-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-900">
                    AI Deal Brief
                  </span>
                </div>
                <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                  Generate a structured investor-ready report combining project
                  data, AI scores, and document findings.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                  onClick={() =>
                    navigate(`/app/investor/data-rooms/${id}/deal-brief`)
                  }
                >
                  <Sparkles className="size-3.5" />
                  {dataRoom.dealBrief
                    ? "View Deal Brief"
                    : "Generate Deal Brief"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips for startup */}
          {isOwner && (
            <Card className="border border-gray-200 bg-amber-50/40">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                  Tips
                </p>
                <div className="space-y-1.5 text-xs text-amber-800">
                  <p>• Upload PDFs — text is auto-extracted for AI analysis</p>
                  <p>
                    • Use "AI Suggest" to draft answers to investor questions
                  </p>
                  <p>• Always review AI suggestions before sending</p>
                  <p>• Set sensitive docs to "On Request" access</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
