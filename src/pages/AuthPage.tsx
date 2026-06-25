import { useEffect, useState, type FormEvent } from "react";
import type { AuthMode, LoginValues, RegisterValues, SocialProviderName } from "@/types";
import { cn } from "@/utils/cn";
import { HERO_IMAGE_URL, INDUSTRIES, LOCATIONS } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { Badge, Button, ErrorMessage, Field, LogoMark, Panel, PasswordField, SelectField, SuccessMessage, TextareaField } from "@/components/ui";

export function AuthPage({
  mode,
  firebaseEnabled,
  onLogin,
  onRegister,
  onReset,
  onSocialLogin,
  onDemoLogin,
}: {
  mode: AuthMode;
  firebaseEnabled: boolean;
  onLogin: (values: LoginValues) => Promise<void>;
  onRegister: (values: RegisterValues) => Promise<void>;
  onReset: (email: string) => Promise<void>;
  onSocialLogin: (providerName: SocialProviderName) => Promise<void>;
  onDemoLogin: (kind: "member" | "admin") => Promise<void>;
}) {
  const navigate = useNavigate();
  const [loginValues, setLoginValues] = useState<LoginValues>({ email: "", password: "" });
  const [registerValues, setRegisterValues] = useState<RegisterValues>({
    fullName: "",
    email: "",
    password: "",
    professionalTitle: "",
    industry: "Technology",
    skills: "",
    location: "Remote across Africa",
    bio: "",
    portfolioWebsite: "",
  });
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<SocialProviderName | "">("");

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [mode]);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onLogin(loginValues);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to login.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onRegister(registerValues);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await onReset(resetEmail);
      setSuccess("If the email is registered, password reset instructions have been sent.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  const runDemoLogin = async (kind: "member" | "admin") => {
    setSubmitting(true);
    setError("");
    try {
      await onDemoLogin(kind);
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : "Demo login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const runSocialLogin = async (providerName: SocialProviderName) => {
    setSocialSubmitting(providerName);
    setError("");
    setSuccess("");
    try {
      await onSocialLogin(providerName);
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : "Social sign-in failed.");
    } finally {
      setSocialSubmitting("");
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#142019]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#0B6B3A] lg:block">
          <img className="absolute inset-0 h-full w-full object-cover opacity-70" src={HERO_IMAGE_URL} alt="African professionals networking in a modern office" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#073b22] via-[#0B6B3A]/82 to-[#0B6B3A]/45" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div className="animate-fade-soft">
              <LogoMark />
            </div>
            <div className="max-w-2xl animate-rise">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">Konnekt Africa</p>
              <h1 className="font-heading text-6xl font-bold leading-tight">Konnekt</h1>
              <p className="mt-5 max-w-xl text-2xl font-semibold leading-snug text-white">Connecting Opportunities. Building Success.</p>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
                A professional network for African entrepreneurs, freelancers, investors, recruiters, and business builders.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3 text-sm text-white/80">
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">Profiles</div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">Connections</div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">Opportunities</div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-xl animate-rise">
            <div className="mb-8 lg:hidden">
              <LogoMark />
              <h1 className="mt-8 font-heading text-5xl font-bold text-[#0B6B3A]">Konnekt</h1>
              <p className="mt-3 text-lg font-semibold text-[#142019]">Connecting Opportunities. Building Success.</p>
            </div>

            <Panel className="p-6 sm:p-8">
              <div className="mb-7">
                <Badge tone="gold">{firebaseEnabled ? "Firebase connected" : "Demo mode ready"}</Badge>
                <h2 className="mt-4 font-heading text-3xl font-bold text-[#142019]">
                  {mode === "login" && "Welcome back"}
                  {mode === "register" && "Create your profile"}
                  {mode === "reset" && "Reset password"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === "login" && "Sign in to manage your network, messages, and opportunities."}
                  {mode === "register" && "Build a public professional profile for discovery across Africa."}
                  {mode === "reset" && "We will send a password reset link to your email address."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 rounded-3xl bg-[#F8FAF9] p-1">
                  <button
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm font-bold transition",
                      mode === "login" ? "bg-white text-[#0B6B3A] shadow-sm" : "text-slate-500 hover:text-[#0B6B3A]"
                    )}
                    type="button"
                    onClick={() => navigate("/login")}
                  >
                    I have an account
                  </button>
                  <button
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm font-bold transition",
                      mode === "register" ? "bg-white text-[#0B6B3A] shadow-sm" : "text-slate-500 hover:text-[#0B6B3A]"
                    )}
                    type="button"
                    onClick={() => navigate("/register")}
                  >
                    Create account
                  </button>
                </div>
              </div>

              {error ? <ErrorMessage message={error} /> : null}
              {success ? <SuccessMessage message={success} /> : null}

              {mode !== "reset" ? (
                <div className="mb-5 space-y-3">
                  <div className="grid gap-3">
                    <Button
                      className="w-full"
                      type="button"
                      variant="outline"
                      disabled={!firebaseEnabled || Boolean(socialSubmitting)}
                      loading={socialSubmitting === "google"}
                      onClick={() => void runSocialLogin("google")}
                    >
                      <span className="font-heading text-base">G</span>
                      Continue with Google
                    </Button>
                  </div>
                  {!firebaseEnabled ? (
                    <p className="text-center text-xs text-slate-500">Social sign-in appears after Firebase is connected.</p>
                  ) : null}
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>Email</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                </div>
              ) : null}

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={submitLogin}>
                  <Field
                    label="Email"
                    type="email"
                    value={loginValues.email}
                    onChange={(event) => setLoginValues((previous) => ({ ...previous, email: event.target.value }))}
                    placeholder="you@example.com"
                    required
                  />
                  <PasswordField
                    label="Password"
                    value={loginValues.password}
                    onChange={(event) => setLoginValues((previous) => ({ ...previous, password: event.target.value }))}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-sm font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/reset")}>
                      Forgot password?
                    </button>
                    <Button type="submit" loading={submitting}>Login</Button>
                  </div>

                  <div className="rounded-3xl bg-[#F8FAF9] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Demo credentials</p>
                    <p className="mt-2 text-sm text-slate-600">Member: amina@konnekt.africa / Konnekt123!</p>
                    <p className="text-sm text-slate-600">Admin: admin@konnekt.africa / Admin123!</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={firebaseEnabled || submitting} onClick={() => void runDemoLogin("member")}>Use member demo</Button>
                      <Button type="button" variant="outline" size="sm" disabled={firebaseEnabled || submitting} onClick={() => void runDemoLogin("admin")}>Use admin demo</Button>
                    </div>
                  </div>

                  <p className="text-center text-sm text-slate-500">
                    New to Konnekt?{" "}
                    <button className="font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/register")}>Create account</button>
                  </p>
                </form>
              ) : null}

              {mode === "register" ? (
                <form className="space-y-4" onSubmit={submitRegister}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      value={registerValues.fullName}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, fullName: event.target.value }))}
                      placeholder="Amina Ndlovu"
                      required
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={registerValues.email}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, email: event.target.value }))}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PasswordField
                      label="Password"
                      value={registerValues.password}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, password: event.target.value }))}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <Field
                      label="Professional title"
                      value={registerValues.professionalTitle}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, professionalTitle: event.target.value }))}
                      placeholder="Founder, Designer, Recruiter"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Industry"
                      value={registerValues.industry}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, industry: event.target.value }))}
                    >
                      {INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}
                    </SelectField>
                    <SelectField
                      label="Location"
                      value={registerValues.location}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, location: event.target.value }))}
                    >
                      {LOCATIONS.map((location) => <option key={location}>{location}</option>)}
                    </SelectField>
                  </div>
                  <Field
                    label="Skills"
                    helper="Separate multiple skills with commas."
                    value={registerValues.skills}
                    onChange={(event) => setRegisterValues((previous) => ({ ...previous, skills: event.target.value }))}
                    placeholder="Fundraising, React, Product Strategy"
                  />
                  <TextareaField
                    label="Bio"
                    value={registerValues.bio}
                    onChange={(event) => setRegisterValues((previous) => ({ ...previous, bio: event.target.value }))}
                    placeholder="Tell the network what you build, invest in, or hire for."
                  />
                  <Field
                    label="Portfolio website"
                    value={registerValues.portfolioWebsite}
                    onChange={(event) => setRegisterValues((previous) => ({ ...previous, portfolioWebsite: event.target.value }))}
                    placeholder="https://example.com"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-sm font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/login")}>
                      Already have an account?
                    </button>
                    <Button type="submit" loading={submitting}>Register</Button>
                  </div>
                </form>
              ) : null}

              {mode === "reset" ? (
                <form className="space-y-4" onSubmit={submitReset}>
                  <Field
                    label="Email"
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-sm font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/login")}>
                      Back to login
                    </button>
                    <Button type="submit" loading={submitting}>Send reset link</Button>
                  </div>
                </form>
              ) : null}
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}
