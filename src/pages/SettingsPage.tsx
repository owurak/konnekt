import { useState } from "react";
import type { UserProfile } from "@/types";
import { isAdminUser } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Avatar, Button, InfoLine, Panel, SectionTitle, StatusLine } from "@/components/ui";

export function SettingsPage({
  currentUser,
  firebaseEnabled,
  storageEnabled,
  onLogout,
}: {
  currentUser: UserProfile;
  firebaseEnabled: boolean;
  storageEnabled: boolean;
  onLogout: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const runLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar user={currentUser} size="lg" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Settings</p>
              <h1 className="mt-1 font-heading text-3xl font-bold text-[#142019]">Account and app controls</h1>
              <p className="mt-1 text-sm text-slate-500">Manage your Konnekt session, profile, and platform access.</p>
            </div>
          </div>
          <Button variant="danger" loading={loggingOut} onClick={() => void runLogout()}>
            <Icon name="logout" /> Logout
          </Button>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Panel>
          <SectionTitle title="Account" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoLine icon="user" label="Name" value={currentUser.fullName} />
            <InfoLine icon="mail" label="Email" value={currentUser.email || "No email on profile"} />
            <InfoLine icon="briefcase" label="Professional title" value={currentUser.professionalTitle} />
            <InfoLine icon="shield" label="Role" value={isAdminUser(currentUser) ? "Admin" : "Member"} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/profile/${currentUser.id}`)}>
              <Icon name="user" /> View profile
            </Button>
            {isAdminUser(currentUser) ? (
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <Icon name="admin" /> Admin panel
              </Button>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Platform status" />
          <div className="mt-5 space-y-3">
            <StatusLine label="Firebase" active={firebaseEnabled} activeText="Connected" inactiveText="Demo mode" />
            <StatusLine label="Authentication" active={firebaseEnabled} activeText="Live auth" inactiveText="Local demo auth" />
            <StatusLine label="Profile photo storage" active={storageEnabled} activeText="Enabled" inactiveText="Skipped for now" />
            <StatusLine label="Offline access" active={false} activeText="Enabled" inactiveText="Blocked for live data safety" />
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionTitle title="Security" />
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Passwords are handled by Firebase Authentication and are not stored in Firestore. Use logout on shared devices, especially on mobile browsers.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/reset")}>Reset password</Button>
          <Button variant="danger" loading={loggingOut} onClick={() => void runLogout()}>
            <Icon name="logout" /> Logout from this device
          </Button>
        </div>
      </Panel>
    </div>
  );
}
