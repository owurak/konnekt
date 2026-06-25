import { useState, type FormEvent } from "react";
import type { CreateListingValues, UserProfile } from "@/types";
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/utils/constants";
import { Button, ErrorMessage, Field, Panel, SelectField, TextareaField } from "./ui";

export function CreateListingPanel({
  currentUser,
  onCreateListing,
  onCancel,
}: {
  currentUser: UserProfile;
  onCreateListing: (values: CreateListingValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<CreateListingValues>({
    name: "",
    category: "Beauty & Makeup",
    description: "",
    price: "",
    condition: "New",
    location: currentUser.location || "Remote across Africa",
    phone: "",
    website: "",
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onCreateListing(values);
    } catch (listingError) {
      setError(listingError instanceof Error ? listingError.message : "Unable to post listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Jiji-style marketplace</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-[#142019]">Post a product, service, or business listing</h2>
          <p className="mt-1 text-sm text-slate-500">Seller details are taken from your registered profile: {currentUser.fullName}.</p>
        </div>
        <Button variant="ghost" type="button" onClick={onCancel}>Close</Button>
      </div>
      {error ? <div className="mt-4"><ErrorMessage message={error} /></div> : null}
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Listing title" value={values.name} onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))} placeholder="iPhone 13 Pro / Makeup service / Printing package" required />
          <SelectField label="Category" value={values.category} onChange={(event) => setValues((previous) => ({ ...previous, category: event.target.value }))}>
            {LISTING_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </SelectField>
        </div>
        <TextareaField label="Description" value={values.description} onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))} placeholder="Describe the product/service, quality, delivery, and what buyers should know." required />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Price" value={values.price} onChange={(event) => setValues((previous) => ({ ...previous, price: event.target.value }))} placeholder="GHS 500 / Negotiable" />
          <SelectField label="Condition" value={values.condition} onChange={(event) => setValues((previous) => ({ ...previous, condition: event.target.value }))}>
            {LISTING_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
          </SelectField>
          <Field label="Location" value={values.location} onChange={(event) => setValues((previous) => ({ ...previous, location: event.target.value }))} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Phone / WhatsApp" value={values.phone} onChange={(event) => setValues((previous) => ({ ...previous, phone: event.target.value }))} placeholder="+233..." />
          <Field label="Website/social link" value={values.website} onChange={(event) => setValues((previous) => ({ ...previous, website: event.target.value }))} placeholder="https://..." />
          <Field label="Image URL" value={values.imageUrl} onChange={(event) => setValues((previous) => ({ ...previous, imageUrl: event.target.value }))} placeholder="Paste image link for now" helper="No Firebase Storage needed. Uploads can be added later with Cloudinary or Storage." />
        </div>
        <div className="rounded-2xl bg-[#F8FAF9] p-4 text-sm leading-6 text-slate-600">
          <strong>Approval:</strong> normal member listings are submitted for admin approval before appearing publicly. Admin listings publish immediately.
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>Post listing</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Panel>
  );
}
