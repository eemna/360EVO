import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Users as UsersIcon,
  Loader2,
  Search,
  ShieldOff,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "../components/ui/dialog";
import { ConfirmActionDialog } from "../components/ui/ConfirmActionDialog";
import api from "../../services/axios";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  profile?: { expertise?: string[]; expertApplicationStatus?: string };
};

const ROLE_COLORS: Record<string, string> = {
  STARTUP: "bg-blue-100 text-blue-700",
  MEMBER: "bg-purple-100 text-purple-700",
  EXPERT: "bg-green-100 text-green-700",
  ADMIN: "bg-red-100 text-red-700",
  INVESTOR: "bg-yellow-100 text-yellow-700",
};

type PendingRoleChange = { user: User; newRole: string } | null;

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // ── Confirmation dialog states ──────────────────────
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange>(null);
  const [pendingSuspend, setPendingSuspend] = useState<User | null>(null);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  // ── Invite Admin modal states ────────────────────────
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingInvite, setPendingInvite] = useState<string | null>(null); // email awaiting confirmation

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Role change ──────────────────────────────────────
  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { user, newRole } = pendingRoleChange;
    setActionLoadingId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Suspend / Unsuspend ──────────────────────────────
  const confirmToggleSuspend = async () => {
    if (!pendingSuspend) return;
    const user = pendingSuspend;
    setActionLoadingId(user.id);
    try {
      const endpoint = user.isSuspended
        ? `/admin/users/${user.id}/unsuspend`
        : `/admin/users/${user.id}/suspend`;
      await api.patch(endpoint);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u,
        ),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const user = pendingDelete;
    setActionLoadingId(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Invite admin by email ────────────────────────────
  const submitInviteEmail = () => {
    if (!inviteEmail.trim()) return;
    setShowInviteModal(false);
    setPendingInvite(inviteEmail.trim());
  };

  const confirmInviteAdmin = async () => {
    if (!pendingInvite) return;
    await api.post("/admin/admins/invite", { email: pendingInvite });
    setInviteEmail("");
    await fetchUsers(); // in case the email matched an existing user who got promoted
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage platform users</p>
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
          onClick={() => {
            setInviteEmail("");
            setShowInviteModal(true);
          }}
        >
          <UserPlus className="size-4" />
          Add Admin
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="STARTUP">Startup</SelectItem>
            <SelectItem value="EXPERT">Expert</SelectItem>
            <SelectItem value="INVESTOR">Investor</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon className="size-4" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Sign-up Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.isSuspended ? "bg-red-50 opacity-80" : ""}>
                  <TableCell
                    className="font-medium cursor-pointer hover:text-indigo-600"
                    onClick={() => navigate(`/app/profile/${user.id}`)}
                  >
                    {user.name}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={user.isSuspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                      {user.isSuspended ? "Suspended" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={user.isSuspended || actionLoadingId === user.id}
                      onValueChange={(newRole) => {
                        if (newRole === user.role) return;
                        setPendingRoleChange({ user, newRole });
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="STARTUP">Startup</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                        <SelectItem value="INVESTOR">Investor</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === user.id}
                        onClick={() => setPendingSuspend(user)}
                        className={
                          user.isSuspended
                            ? "border-green-500 text-green-600 hover:bg-green-50"
                            : "border-red-400 text-red-600 hover:bg-red-50"
                        }
                      >
                        {actionLoadingId === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : user.isSuspended ? (
                          <><ShieldCheck className="size-4 mr-1" />Reactivate</>
                        ) : (
                          <><ShieldOff className="size-4 mr-1" />Suspend</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === user.id || user.role === "ADMIN"}
                        onClick={() => setPendingDelete(user)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        title={user.role === "ADMIN" ? "Demote before deleting" : "Delete user"}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Role change confirmation ── */}
      <ConfirmActionDialog
        open={!!pendingRoleChange}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
        title={
          pendingRoleChange?.newRole === "ADMIN"
            ? "Grant admin access?"
            : "Change role?"
        }
        description={
          pendingRoleChange
            ? pendingRoleChange.newRole === "ADMIN"
              ? `You are about to give ${pendingRoleChange.user.name} (${pendingRoleChange.user.email}) full admin access to the platform. This is the most sensitive permission available.`
              : `Change ${pendingRoleChange.user.name}'s role from ${pendingRoleChange.user.role} to ${pendingRoleChange.newRole}?`
            : ""
        }
        confirmLabel={pendingRoleChange?.newRole === "ADMIN" ? "Grant admin access" : "Change role"}
        destructive={pendingRoleChange?.newRole === "ADMIN"}
        requireTextConfirmation={
          pendingRoleChange?.newRole === "ADMIN" ? pendingRoleChange.user.email : undefined
        }
        requireTextLabel="Type the user's email to confirm"
        onConfirm={confirmRoleChange}
      />

      {/* ── Suspend / Unsuspend confirmation ── */}
      <ConfirmActionDialog
        open={!!pendingSuspend}
        onOpenChange={(open) => !open && setPendingSuspend(null)}
        title={pendingSuspend?.isSuspended ? "Reactivate this account?" : "Suspend this account?"}
        description={
          pendingSuspend
            ? pendingSuspend.isSuspended
              ? `${pendingSuspend.name} will be able to log in again immediately.`
              : `${pendingSuspend.name} will be immediately signed out and unable to log in until reactivated.`
            : ""
        }
        confirmLabel={pendingSuspend?.isSuspended ? "Reactivate" : "Suspend"}
        destructive={!pendingSuspend?.isSuspended}
        onConfirm={confirmToggleSuspend}
      />

      {/* ── Delete confirmation (two-step: typed email) ── */}
      <ConfirmActionDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Permanently delete this account?"
        description={
          pendingDelete
            ? `This will permanently delete ${pendingDelete.name}'s account and all associated data. This action cannot be undone.`
            : ""
        }
        confirmLabel="Yes, permanently delete"
        destructive
        requireTextConfirmation={pendingDelete?.email}
        requireTextLabel="Type the user's email to confirm deletion"
        onConfirm={confirmDelete}
      />

      {/* ── Invite Admin: step 1, enter email ── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add an admin</DialogTitle>
            <DialogDescription>
              Enter the email of the person you want to grant admin access to.
              If they already have an account, they'll be promoted immediately.
              Otherwise, we'll email them an invite.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="name@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={submitInviteEmail}
              disabled={!inviteEmail.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite Admin: step 2, confirm ── */}
      <ConfirmActionDialog
        open={!!pendingInvite}
        onOpenChange={(open) => !open && setPendingInvite(null)}
        title="Grant admin access?"
        description={`You are about to give admin access to ${pendingInvite}. This is the most sensitive permission on the platform.`}
        confirmLabel="Grant admin access"
        destructive
        requireTextConfirmation={pendingInvite ?? undefined}
        requireTextLabel="Type the email to confirm"
        onConfirm={confirmInviteAdmin}
      />
    </div>
  );
}