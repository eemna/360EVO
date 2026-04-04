import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { AppModal } from "../components/ui/modal";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import {
  FileSearch, CheckCircle2, XCircle, Clock,
  FolderOpen, MessageSquare, Shield, ChevronRight, Inbox,
} from "lucide-react";

interface DdRequestReceived {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  message: string | null;
  nda: boolean;
  createdAt: string;
  reviewedAt: string | null;
  investor: {
    name: string;
    email: string;
    profile: { avatar: string | null; bio: string | null; location: string | null } | null;
  };
  project: { id: string; title: string };
  dataRoom: { id: string; expiresAt: string } | null;
}

interface DdRequestSent {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  message: string | null;
  nda: boolean;
  createdAt: string;
  reviewedAt: string | null;
  project: { id: string; title: string; owner: { name: string } };
  dataRoom: { id: string; expiresAt: string } | null;
}

type DdRequest = DdRequestReceived | DdRequestSent;

const statusConfig = {
  PENDING: { label: "Pending Review", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  DECLINED: { label: "Declined", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
};

export default function DdInboxPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isInvestor = user?.role === "INVESTOR";

  const [requests, setRequests] = useState<DdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "decline" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "DECLINED">("ALL");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = isInvestor ? "/dd-requests/sent" : "/dd-requests/received";
      const { data } = await api.get(endpoint);
      setRequests(data);
    } catch {
      showToast({ type: "error", title: "Failed to load requests", message: "" });
    } finally {
      setLoading(false);
    }
  }, [showToast, isInvestor]);

  useEffect(() => {
    if (user) fetchRequests();
  }, [fetchRequests, user]);

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    try {
      setProcessing(true);
      await api.put(`/dd-requests/${actionId}/${actionType}`);
      showToast({
        type: "success",
        title: actionType === "approve" ? "Request Approved" : "Request Declined",
        message: actionType === "approve"
          ? "The investor now has 30-day access to the data room."
          : "The investor has been notified.",
      });
      await fetchRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Action failed";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setProcessing(false);
      setActionId(null);
      setActionType(null);
    }
  };

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    DECLINED: requests.filter((r) => r.status === "DECLINED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
            <Inbox className="size-7 text-indigo-600" />
            {isInvestor ? "My DD Requests" : "DD Request Inbox"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isInvestor
              ? "Track your due diligence access requests"
              : "Manage investor due diligence access requests for your projects"}
          </p>
        </div>
        {counts.PENDING > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-sm font-semibold">
            <Clock className="size-3.5" />
            {counts.PENDING} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}{" "}
            <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSearch className="size-10 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {filter === "ALL"
                ? isInvestor ? "No DD requests sent yet" : "No DD requests yet"
                : `No ${filter.toLowerCase()} requests`}
            </h3>
            <p className="text-sm text-gray-400">
              {isInvestor
                ? "Find a project you're interested in and request due diligence access."
                : "When investors request due diligence access, they'll appear here."}
            </p>
            {isInvestor && (
              <Button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate("/app/projects")}
              >
                Browse Projects
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const cfg = statusConfig[req.status];
            const StatusIcon = cfg.icon;
            const receivedReq = req as DdRequestReceived;
            const sentReq = req as DdRequestSent;

            return (
              <Card key={req.id} className="border border-gray-200 hover:shadow-sm transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Avatar — only for startup view (investor info) */}
                    {!isInvestor && (
                      <Avatar className="size-11 flex-shrink-0">
                        <AvatarImage src={receivedReq.investor?.profile?.avatar || undefined} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                          {receivedReq.investor?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {/* Investor view: show startup/project name */}
                        {isInvestor ? (
                          <span className="font-semibold text-gray-900">
                            {sentReq.project?.title}
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold text-gray-900">
                              {receivedReq.investor?.name}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {receivedReq.investor?.email}
                            </span>
                          </>
                        )}

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                          <StatusIcon className="size-3" />
                          {cfg.label}
                        </span>
                        {req.nda && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Shield className="size-3" />
                            NDA Agreed
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-1">
                        {isInvestor ? (
                          <>
                            By{" "}
                            <span className="font-medium text-gray-700">
                              {sentReq.project?.owner?.name}
                            </span>
                          </>
                        ) : (
                          <>
                            Project:{" "}
                            <span className="font-medium text-gray-700">
                              {receivedReq.project?.title}
                            </span>
                          </>
                        )}
                        {" · "}
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>

                      {req.message && (
                        <div className="flex items-start gap-2 mt-2 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                          <MessageSquare className="size-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                            {req.message}
                          </p>
                        </div>
                      )}

                      {/* Investor view: show expiry if approved */}
                      {isInvestor && req.status === "APPROVED" && req.dataRoom && (
                        <p className="text-xs text-green-600 mt-1">
                          Access expires:{" "}
                          {new Date(req.dataRoom.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* STARTUP: approve/decline pending requests */}
                      {!isInvestor && req.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setActionId(req.id); setActionType("decline"); }}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="size-4 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => { setActionId(req.id); setActionType("approve"); }}
                            className="bg-green-600 hover:bg-green-700 gap-1"
                          >
                            <CheckCircle2 className="size-4" />
                            Approve
                          </Button>
                        </>
                      )}

                      {/* STARTUP: open their own data room */}
                      {!isInvestor && req.status === "APPROVED" && req.dataRoom && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/app/startup/data-rooms/${req.dataRoom!.id}`)}
                          className="bg-indigo-600 hover:bg-indigo-700 gap-1"
                        >
                          <FolderOpen className="size-4" />
                          Open Data Room
                          <ChevronRight className="size-3" />
                        </Button>
                      )}

                      {/* INVESTOR: open data room when approved */}
                      {isInvestor && req.status === "APPROVED" && req.dataRoom && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/app/investor/data-rooms/${req.dataRoom!.id}`)}
                          className="bg-green-600 hover:bg-green-700 gap-1"
                        >
                          <FolderOpen className="size-4" />
                          Enter Data Room
                          <ChevronRight className="size-3" />
                        </Button>
                      )}

                      {/* INVESTOR: pending — show waiting state */}
                      {isInvestor && req.status === "PENDING" && (
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                          Awaiting startup approval
                        </span>
                      )}

                      {/* INVESTOR: declined */}
                      {isInvestor && req.status === "DECLINED" && (
                        <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                          Request declined
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Modal — startup only */}
      {!isInvestor && (
        <AppModal
          open={!!actionId}
          onOpenChange={() => { setActionId(null); setActionType(null); }}
          title={actionType === "approve" ? "Approve DD Request" : "Decline DD Request"}
          description={
            actionType === "approve"
              ? "The investor will get 30-day access to your data room."
              : "The investor will be notified that their request was declined."
          }
          submitText={actionType === "approve" ? "Approve" : "Decline"}
          cancelText="Cancel"
          onSubmit={handleAction}
        >
          {processing && (
            <div className="flex justify-center py-2">
              <LoadingSpinner size="md" />
            </div>
          )}
        </AppModal>
      )}
    </div>
  );
}