import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Connection, Opportunity, ProfileFormValues, UserProfile } from "@/types";
import { canViewOpportunity, getAcceptedConnectionCount, profileToForm, splitTags } from "@/utils/helpers";
import { INDUSTRIES, LOCATIONS } from "@/utils/constants";
import { optimizeProfilePhotoFile, validateProfilePhotoFile, fileToDataUrl } from "@/utils/photo";
import { useNavigate } from "react-router-dom";
import { ConnectionControls } from "@/components/ConnectionControls";
import { OpportunityRow } from "@/components/OpportunityCard";
import { Icon } from "@/components/Icon";
import { Avatar, Badge, Button, EmptyState, ErrorMessage, Field, InfoLine, Panel, SelectField, SectionTitle, SuccessMessage, TextareaField } from "@/components/ui";

export function ProfilePage({
  profile,
  currentUser,
  connections,
  opportunities,
  onSaveProfile,
  onUploadPhoto,
  profilePhotoUploadAvailable,
  onConnect,
  onRespondConnection,
}: {
  profile: UserProfile | null;
  currentUser: UserProfile;
  connections: Connection[];
  opportunities: Opportunity[];
  onSaveProfile: (userId: string, patch: Partial<UserProfile>) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<string>;
  profilePhotoUploadAvailable: boolean;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(() => (profile || currentUser).photoUrl);
  const [formValues, setFormValues] = useState<ProfileFormValues>(() => profileToForm(profile || currentUser));

  useEffect(() => {
    setEditing(false);
    setPhotoFile(null);
    setPhotoPreviewUrl((profile || currentUser).photoUrl);
    setFormValues(profileToForm(profile || currentUser));
  }, [profile, currentUser]);

  if (!profile) {
    return <EmptyState title="Profile not found" description="This profile may have been removed or suspended." action={<Button onClick={() => navigate("/network")}>Back to network</Button>} />;
  }

  const displayProfile = { ...profile, photoUrl: photoPreviewUrl || profile.photoUrl };
  const isOwnProfile = profile.id === currentUser.id;
  const profileOpportunities = opportunities
    .filter((opportunity) => opportunity.posterId === profile.id && canViewOpportunity(opportunity, currentUser))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const connectedProfilesCount = getAcceptedConnectionCount(profile.id, connections);

  const updateFormValue = (field: keyof ProfileFormValues, value: string) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSuccess("Preparing photo...");
      const optimizedFile = await optimizeProfilePhotoFile(file);
      validateProfilePhotoFile(optimizedFile, "upload");
      setPhotoFile(optimizedFile);
      setPhotoPreviewUrl(await fileToDataUrl(optimizedFile));
      setError("");
      setSuccess(
        optimizedFile.size < file.size
          ? "Photo optimized. Save changes to upload it."
          : "Photo selected. Save changes to upload it."
      );
    } catch (photoError) {
      event.target.value = "";
      setPhotoFile(null);
      setPhotoPreviewUrl(profile.photoUrl);
      setSuccess("");
      setError(photoError instanceof Error ? photoError.message : "Unable to use that image.");
    }
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const patch: Partial<UserProfile> = {
        fullName: formValues.fullName.trim(),
        professionalTitle: formValues.professionalTitle.trim(),
        industry: formValues.industry,
        skills: splitTags(formValues.skills),
        location: formValues.location,
        bio: formValues.bio.trim(),
        portfolioWebsite: formValues.portfolioWebsite.trim(),
      };
      if (photoFile) patch.photoUrl = await onUploadPhoto(photoFile);
      await onSaveProfile(profile.id, patch);
      if (patch.photoUrl) setPhotoPreviewUrl(patch.photoUrl);
      setPhotoFile(null);
      setSuccess(photoFile ? "Profile photo and details updated successfully." : "Profile updated successfully.");
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="animate-rise overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-r from-[#0B6B3A] via-[#0B6B3A] to-[#D4AF37]" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar user={displayProfile} size="xl" className="ring-4 ring-white" />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-3xl font-bold text-[#142019]">{profile.fullName}</h1>
                  <Badge tone="primary">{connectedProfilesCount} connection{connectedProfilesCount === 1 ? "" : "s"}</Badge>
                  {profile.verified ? <Badge tone="gold">Verified profile</Badge> : null}
                </div>
                <p className="mt-1 text-base font-semibold text-slate-700">{profile.professionalTitle}</p>
                <p className="mt-1 text-sm text-slate-500">{profile.industry} in {profile.location}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <Button variant="outline" onClick={() => setEditing((previous) => !previous)}><Icon name="edit" /> {editing ? "Cancel" : "Edit profile"}</Button>
              ) : (
                <ConnectionControls currentUser={currentUser} target={profile} connections={connections} onConnect={onConnect} onRespondConnection={onRespondConnection} />
              )}
            </div>
          </div>
        </div>
      </Panel>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? <SuccessMessage message={success} /> : null}

      {editing && isOwnProfile ? (
        <Panel>
          <SectionTitle title="Edit profile" />
          <form className="mt-5 space-y-4" onSubmit={submitProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={formValues.fullName} onChange={(event) => updateFormValue("fullName", event.target.value)} required />
              <Field label="Professional title" value={formValues.professionalTitle} onChange={(event) => updateFormValue("professionalTitle", event.target.value)} />
              <SelectField label="Industry" value={formValues.industry} onChange={(event) => updateFormValue("industry", event.target.value)}>
                {INDUSTRIES.map((industryName) => <option key={industryName}>{industryName}</option>)}
              </SelectField>
              <SelectField label="Location" value={formValues.location} onChange={(event) => updateFormValue("location", event.target.value)}>
                {LOCATIONS.map((locationName) => <option key={locationName}>{locationName}</option>)}
              </SelectField>
            </div>
            <Field label="Skills" helper="Separate skills with commas." value={formValues.skills} onChange={(event) => updateFormValue("skills", event.target.value)} />
            <TextareaField label="Bio" value={formValues.bio} onChange={(event) => updateFormValue("bio", event.target.value)} />
            <Field label="Portfolio website" value={formValues.portfolioWebsite} onChange={(event) => updateFormValue("portfolioWebsite", event.target.value)} />
            <div className="rounded-3xl border border-slate-200 bg-[#F8FAF9] p-4">
              <span className="text-sm font-semibold text-slate-700">Profile photo</span>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar user={displayProfile} size="xl" className="ring-4 ring-white" />
                <div className="flex-1">
                  {profilePhotoUploadAvailable ? (
                    <>
                      <p className="text-sm text-slate-600">Upload a clear JPG, PNG, WebP, or GIF image. Large photos are optimized before upload.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0B6B3A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#095a31]">
                          Choose photo
                          <input key={photoFile ? "photo-selected" : "photo-empty"} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void handlePhotoChange(event)} />
                        </label>
                        {photoFile ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreviewUrl(profile.photoUrl);
                              setSuccess("");
                            }}
                          >
                            Remove selection
                          </Button>
                        ) : null}
                      </div>
                      {photoFile ? <p className="mt-2 text-xs font-semibold text-[#0B6B3A]">Selected: {photoFile.name}</p> : null}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      Profile photo uploads are skipped for now because Firebase Storage is not enabled. Your generated initials avatar will still work.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button type="submit" loading={saving}>Save changes</Button>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Panel>
            <SectionTitle title="About" />
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{profile.bio || "This professional has not added a bio yet."}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoLine icon="mail" label="Email" value={profile.email} />
              <InfoLine icon="location" label="Location" value={profile.location} />
              {profile.portfolioWebsite ? <InfoLine icon="link" label="Portfolio" value={profile.portfolioWebsite} /> : null}
              <InfoLine icon="network" label="Connections" value={`${connectedProfilesCount} accepted`} />
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Skills" />
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.length ? profile.skills.map((skillName) => <Badge key={skillName} tone="primary">{skillName}</Badge>) : <p className="text-sm text-slate-500">No skills added yet.</p>}
            </div>
          </Panel>
        </div>

        <Panel>
          <SectionTitle title="Posted opportunities" />
          <div className="mt-4 space-y-3">
            {profileOpportunities.length ? (
              profileOpportunities.map((opportunity) => (
                <OpportunityRow key={opportunity.id} opportunity={opportunity} poster={profile} />
              ))
            ) : (
              <p className="rounded-2xl bg-[#F8FAF9] p-4 text-sm text-slate-500">No opportunities posted yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
