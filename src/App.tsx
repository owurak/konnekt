import { useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  setPersistence,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams as useRouterParams } from "react-router-dom";
import { auth, db, isFirebaseConfigured, storage } from "./lib/firebase";
import type {
  BusinessListing,
  Connection,
  CreateListingValues,
  CreateOpportunityValues,
  DemoAccount,
  LoginValues,
  Message,
  NotificationItem,
  NotificationType,
  Opportunity,
  RegisterValues,
  SocialProviderName,
  UserProfile,
} from "./types";
import {
  avatarUrl,
  getConnectionState,
  isAdminUser,
  mapSnapshot,
  newId,
  normalize,
  nowIso,
  splitTags,
} from "./utils/helpers";
import {
  fileToDataUrl,
  getSocialAuthErrorMessage,
  getStorageUploadErrorMessage,
  optimizeProfilePhotoFile,
  shouldUseRedirectSignIn,
  validateProfilePhotoFile,
} from "./utils/photo";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { loadDemoStore, saveDemoStore, createSeedStore, buildFirebaseProfile } from "./data/seed";

import { AppShell } from "./components/AppShell";
import { FullScreenLoader, OfflineScreen, SuspendedScreen } from "./components/ui";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NetworkPage } from "./pages/NetworkPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { OpportunityDetailsPage } from "./pages/OpportunityDetailsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";
import { AccessDenied } from "./pages/AccessDenied";
import { NotFound } from "./pages/NotFound";

function AppRoutes() {
  const navigate = useNavigate();
  const initialDemoStore = useMemo(() => loadDemoStore(), []);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [loadingData, setLoadingData] = useState(isFirebaseConfigured);
  const [runtimeError, setRuntimeError] = useState("");
  const [accounts, setAccounts] = useState<DemoAccount[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.accounts
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    isFirebaseConfigured ? null : initialDemoStore.currentUserId
  );
  const [users, setUsers] = useState<UserProfile[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.users
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.connections
  );
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.opportunities
  );
  const [listings, setListings] = useState<BusinessListing[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.listings
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.notifications
  );
  const [messages, setMessages] = useState<Message[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.messages
  );

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users]
  );
  const isOnline = useOnlineStatus();

  const unreadNotifications = useMemo(
    () =>
      currentUser
        ? notifications.filter((notification) => notification.userId === currentUser.id && !notification.read)
            .length
        : 0,
    [currentUser, notifications]
  );

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    setAuthReady(false);

    void (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await getRedirectResult(auth);
        if (!cancelled && result?.user) {
          setCurrentUserId(result.user.uid);
          navigate("/");
        }
      } catch (redirectError) {
        if (!cancelled) {
          setRuntimeError(getSocialAuthErrorMessage(redirectError));
        }
      }

      if (!cancelled) {
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setCurrentUserId(firebaseUser ? firebaseUser.uid : null);
          setAuthReady(true);
        });
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const firestore = db;
    if (!firestore || currentUserId) return undefined;

    const unsubscribePublicListings = onSnapshot(
      query(collection(firestore, "listings"), where("status", "==", "approved")),
      (snapshot) => setListings(mapSnapshot<BusinessListing>(snapshot)),
      (error) => setRuntimeError(error.message)
    );

    return () => unsubscribePublicListings();
  }, [currentUserId]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !currentUserId) {
      if (isFirebaseConfigured) {
        setLoadingData(false);
      }
      return undefined;
    }

    setLoadingData(true);
    const handleSnapshotError = (error: Error) => {
      setRuntimeError(error.message);
      setLoadingData(false);
    };

    const unsubscribeUsers = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const nextUsers = mapSnapshot<UserProfile>(snapshot);
        setUsers(nextUsers);
        if (auth?.currentUser && !nextUsers.some((user) => user.id === currentUserId)) {
          void setDoc(doc(firestore, "users", currentUserId), buildFirebaseProfile(auth.currentUser), {
            merge: true,
          });
        }
        setLoadingData(false);
      },
      handleSnapshotError
    );

    let sentConnections: Connection[] = [];
    let receivedConnections: Connection[] = [];
    const syncConnections = () => {
      const unique = new Map<string, Connection>();
      [...sentConnections, ...receivedConnections].forEach((connection) => {
        unique.set(connection.id, connection);
      });
      setConnections(Array.from(unique.values()));
    };

    const unsubscribeSentConnections = onSnapshot(
      query(collection(firestore, "connections"), where("senderId", "==", currentUserId)),
      (snapshot) => {
        sentConnections = mapSnapshot<Connection>(snapshot);
        syncConnections();
      },
      handleSnapshotError
    );
    const unsubscribeReceivedConnections = onSnapshot(
      query(collection(firestore, "connections"), where("receiverId", "==", currentUserId)),
      (snapshot) => {
        receivedConnections = mapSnapshot<Connection>(snapshot);
        syncConnections();
      },
      handleSnapshotError
    );
    const unsubscribeOpportunities = onSnapshot(
      collection(firestore, "opportunities"),
      (snapshot) => setOpportunities(mapSnapshot<Opportunity>(snapshot)),
      handleSnapshotError
    );
    const unsubscribeListings = onSnapshot(
      collection(firestore, "listings"),
      (snapshot) => setListings(mapSnapshot<BusinessListing>(snapshot)),
      handleSnapshotError
    );
    const unsubscribeNotifications = onSnapshot(
      query(collection(firestore, "notifications"), where("userId", "==", currentUserId)),
      (snapshot) => setNotifications(mapSnapshot<NotificationItem>(snapshot)),
      handleSnapshotError
    );

    let sentMessages: Message[] = [];
    let receivedMessages: Message[] = [];
    const syncMessages = () => {
      const unique = new Map<string, Message>();
      [...sentMessages, ...receivedMessages].forEach((message) => {
        unique.set(message.id, message);
      });
      setMessages(Array.from(unique.values()));
    };

    const unsubscribeSentMessages = onSnapshot(
      query(collection(firestore, "messages"), where("senderId", "==", currentUserId)),
      (snapshot) => {
        sentMessages = mapSnapshot<Message>(snapshot);
        syncMessages();
      },
      handleSnapshotError
    );
    const unsubscribeReceivedMessages = onSnapshot(
      query(collection(firestore, "messages"), where("receiverId", "==", currentUserId)),
      (snapshot) => {
        receivedMessages = mapSnapshot<Message>(snapshot);
        syncMessages();
      },
      handleSnapshotError
    );

    return () => {
      unsubscribeUsers();
      unsubscribeSentConnections();
      unsubscribeReceivedConnections();
      unsubscribeOpportunities();
      unsubscribeListings();
      unsubscribeNotifications();
      unsubscribeSentMessages();
      unsubscribeReceivedMessages();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    saveDemoStore({
      accounts,
      currentUserId,
      users,
      connections,
      opportunities,
      listings,
      notifications,
      messages,
    });
  }, [accounts, currentUserId, users, connections, opportunities, listings, notifications, messages]);

  const handleLogin = async (values: LoginValues) => {
    setRuntimeError("");
    if (auth) {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);
      setCurrentUserId(credential.user.uid);
      navigate("/");
      return;
    }

    const account = accounts.find(
      (item) => item.email.toLowerCase() === values.email.trim().toLowerCase()
    );
    if (!account || account.password !== values.password) {
      throw new Error("Invalid email or password.");
    }
    const profile = users.find((user) => user.id === account.userId);
    if (!profile) throw new Error("This account no longer has a profile.");
    if (profile.suspended) throw new Error("This account is suspended. Contact an administrator.");
    setCurrentUserId(account.userId);
    navigate("/");
  };

  const handleSocialLogin = async (providerName: SocialProviderName) => {
    setRuntimeError("");
    if (!auth) {
      throw new Error("Social sign-in is available only when Firebase is connected.");
    }

    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithPopup(auth, provider);
      setCurrentUserId(credential.user.uid);
      navigate("/");
    } catch (socialError) {
      const message = socialError instanceof Error ? socialError.message : String(socialError);
      if (shouldUseRedirectSignIn() && message.includes("auth/popup-blocked")) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw new Error(getSocialAuthErrorMessage(socialError, providerName));
    }
  };

  const handleDemoLogin = async (kind: "member" | "admin") => {
    if (isFirebaseConfigured) {
      throw new Error("Demo login is only available when Firebase environment variables are not set.");
    }
    await handleLogin({
      email: kind === "admin" ? "admin@konnekt.africa" : "amina@konnekt.africa",
      password: kind === "admin" ? "Admin123!" : "Konnekt123!",
    });
  };

  const handleRegister = async (values: RegisterValues) => {
    setRuntimeError("");
    if (!values.fullName.trim()) throw new Error("Full name is required.");
    if (values.password.length < 8) throw new Error("Use at least 8 characters for your password.");

    const profileName = values.fullName.trim();
    const cleanEmail = values.email.trim().toLowerCase();
    const newProfile: UserProfile = {
      id: newId("user"),
      fullName: profileName,
      professionalTitle: values.professionalTitle.trim() || "Professional",
      industry: values.industry || "Professional Services",
      skills: splitTags(values.skills),
      location: values.location || "Remote across Africa",
      bio: values.bio.trim(),
      photoUrl: avatarUrl(profileName),
      email: cleanEmail,
      portfolioWebsite: values.portfolioWebsite.trim(),
      role: "member",
      verified: false,
      suspended: false,
      createdAt: nowIso(),
    };

    if (auth && db) {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseProfile = {
        ...newProfile,
        id: credential.user.uid,
        role: "member",
        verified: false,
      } satisfies UserProfile;
      await setDoc(doc(db, "users", credential.user.uid), firebaseProfile);
      setCurrentUserId(credential.user.uid);
      navigate("/");
      return;
    }

    const emailExists = accounts.some(
      (account) => account.email.toLowerCase() === values.email.trim().toLowerCase()
    );
    if (emailExists) throw new Error("An account with this email already exists.");

    setAccounts((previous) => [
      ...previous,
      { userId: newProfile.id, email: newProfile.email, password: values.password },
    ]);
    setUsers((previous) => [newProfile, ...previous]);
    setCurrentUserId(newProfile.id);
    navigate("/");
  };

  const handlePasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Enter your email address.");
    if (auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
      return;
    }
    const exists = accounts.some((account) => account.email.toLowerCase() === cleanEmail);
    if (!exists) throw new Error("No demo account was found for that email.");
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setCurrentUserId(null);
    navigate("/login");
  };

  const saveUserProfile = async (userId: string, patch: Partial<UserProfile>) => {
    if (db) {
      await setDoc(doc(db, "users", userId), patch, { merge: true });
      return;
    }
    setUsers((previous) =>
      previous.map((user) => (user.id === userId ? { ...user, ...patch } : user))
    );
  };

  const createNotification = async (
    userId: string,
    type: NotificationType,
    message: string
  ) => {
    const notification: NotificationItem = {
      id: newId("notification"),
      userId,
      type,
      message,
      read: false,
      createdAt: nowIso(),
    };

    if (db) {
      await setDoc(doc(db, "notifications", notification.id), notification);
      return;
    }
    setNotifications((previous) => [notification, ...previous]);
  };

  const markNotificationRead = async (notificationId: string) => {
    if (db) {
      await setDoc(doc(db, "notifications", notificationId), { read: true }, { merge: true });
      return;
    }
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    const unread = notifications.filter(
      (notification) => notification.userId === currentUser.id && !notification.read
    );
    await Promise.all(unread.map((notification) => markNotificationRead(notification.id)));
  };

  const upsertConnection = async (connection: Connection) => {
    if (db) {
      await setDoc(doc(db, "connections", connection.id), connection);
      return;
    }
    setConnections((previous) => {
      const exists = previous.some((item) => item.id === connection.id);
      if (exists) return previous.map((item) => (item.id === connection.id ? connection : item));
      return [connection, ...previous];
    });
  };

  const updateConnection = async (connectionId: string, patch: Partial<Connection>) => {
    if (db) {
      await setDoc(doc(db, "connections", connectionId), patch, { merge: true });
      return;
    }
    setConnections((previous) =>
      previous.map((connection) =>
        connection.id === connectionId ? { ...connection, ...patch } : connection
      )
    );
  };

  const handleSendConnection = async (receiverId: string) => {
    if (!currentUser) throw new Error("Sign in to connect with professionals.");
    const receiver = users.find((user) => user.id === receiverId && !user.suspended);
    if (!receiver) throw new Error("This profile is not available.");

    const existing = connections.find(
      (connection) =>
        (connection.senderId === currentUser.id && connection.receiverId === receiverId) ||
        (connection.senderId === receiverId && connection.receiverId === currentUser.id)
    );

    if (existing?.status === "accepted" || existing?.status === "pending") return;

    const connection: Connection = {
      id: existing?.id || newId("connection"),
      senderId: currentUser.id,
      receiverId,
      status: "pending",
      createdAt: nowIso(),
    };
    await upsertConnection(connection);
    await createNotification(receiverId, "connection_request", `${currentUser.fullName} wants to connect with you.`);
  };

  const handleRespondConnection = async (
    connectionId: string,
    nextStatus: "accepted" | "rejected"
  ) => {
    if (!currentUser) return;
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection || connection.receiverId !== currentUser.id) return;
    await updateConnection(connectionId, { status: nextStatus });
    if (nextStatus === "accepted") {
      await createNotification(
        connection.senderId,
        "connection_accepted",
        `${currentUser.fullName} accepted your connection request.`
      );
    }
  };

  const notifyOpportunityMatches = async (opportunity: Opportunity) => {
    const title = normalize(opportunity.title);
    const description = normalize(opportunity.description);
    const matches = users.filter((user) => {
      if (user.id === opportunity.posterId || user.suspended) return false;
      const industryMatch =
        user.industry && (title.includes(normalize(user.industry)) || description.includes(normalize(user.industry)));
      const skillMatch = user.skills.some((skill) => title.includes(normalize(skill)) || description.includes(normalize(skill)));
      const locationMatch = normalize(user.location) === normalize(opportunity.location);
      return industryMatch || skillMatch || locationMatch;
    });

    await Promise.all(
      matches.slice(0, 10).map((user) =>
        createNotification(
          user.id,
          "opportunity_match",
          `New ${opportunity.type.toLowerCase()} opportunity may match your profile: ${opportunity.title}.`
        )
      )
    );
  };

  const createOpportunity = async (values: CreateOpportunityValues) => {
    if (!currentUser) throw new Error("Sign in to post opportunities.");
    const opportunity: Opportunity = {
      id: newId("opportunity"),
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      industry: values.industry.trim() || "Professional Services",
      location: values.location.trim() || "Remote across Africa",
      budget: values.budget.trim(),
      deadline: values.deadline,
      applyLink: values.applyLink.trim(),
      posterId: currentUser.id,
      status: "pending",
      createdAt: nowIso(),
    };

    if (!opportunity.title || !opportunity.description) {
      throw new Error("Add a title and description before posting.");
    }

    if (db) {
      await setDoc(doc(db, "opportunities", opportunity.id), opportunity);
    } else {
      setOpportunities((previous) => [opportunity, ...previous]);
    }
  };

  const updateOpportunity = async (opportunityId: string, patch: Partial<Opportunity>) => {
    if (db) {
      await setDoc(doc(db, "opportunities", opportunityId), patch, { merge: true });
      return;
    }
    setOpportunities((previous) =>
      previous.map((opportunity) =>
        opportunity.id === opportunityId ? { ...opportunity, ...patch } : opportunity
      )
    );
  };

  const approveOpportunity = async (opportunityId: string) => {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) return;
    await updateOpportunity(opportunityId, { status: "approved" });
    try {
      await notifyOpportunityMatches({ ...opportunity, status: "approved" });
    } catch (notificationError) {
      setRuntimeError(
        notificationError instanceof Error
          ? `Opportunity approved, but match notifications failed: ${notificationError.message}`
          : "Opportunity approved, but match notifications failed."
      );
    }
  };

  const deleteOpportunity = async (opportunityId: string) => {
    if (db) {
      await deleteDoc(doc(db, "opportunities", opportunityId));
      return;
    }
    setOpportunities((previous) => previous.filter((opportunity) => opportunity.id !== opportunityId));
  };

  const createListing = async (values: CreateListingValues) => {
    if (!currentUser) throw new Error("Sign in before posting a listing.");
    const listing: BusinessListing = {
      id: newId("listing"),
      name: values.name.trim(),
      category: values.category,
      description: values.description.trim(),
      price: values.price.trim(),
      condition: values.condition,
      location: values.location.trim() || currentUser.location || "Remote across Africa",
      phone: values.phone.trim(),
      website: values.website.trim(),
      imageUrl: values.imageUrl.trim(),
      verified: currentUser.verified,
      sellerId: currentUser.id,
      sellerName: currentUser.fullName,
      sellerEmail: currentUser.email,
      status: isAdminUser(currentUser) ? "approved" : "pending",
      createdAt: nowIso(),
    };

    if (!listing.name || !listing.description || !listing.category) {
      throw new Error("Add a title, category, and description before posting.");
    }

    if (db) {
      await setDoc(doc(db, "listings", listing.id), listing);
    } else {
      setListings((previous) => [listing, ...previous]);
    }
  };

  const updateListing = async (listingId: string, patch: Partial<BusinessListing>) => {
    if (db) {
      await setDoc(doc(db, "listings", listingId), patch, { merge: true });
      return;
    }
    setListings((previous) =>
      previous.map((listing) => (listing.id === listingId ? { ...listing, ...patch } : listing))
    );
  };

  const approveListing = async (listingId: string) => {
    await updateListing(listingId, { status: "approved" });
  };

  const deleteListing = async (listingId: string) => {
    if (db) {
      await deleteDoc(doc(db, "listings", listingId));
      return;
    }
    setListings((previous) => previous.filter((listing) => listing.id !== listingId));
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!currentUser) throw new Error("Sign in before uploading a photo.");
    const uploadFile = await optimizeProfilePhotoFile(file);
    validateProfilePhotoFile(uploadFile, "upload");
    if (storage) {
      const safeName = uploadFile.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
      const imageRef = ref(storage, `profile-photos/${currentUser.id}/${Date.now()}-${safeName}`);
      try {
        await uploadBytes(imageRef, uploadFile, {
          cacheControl: "public,max-age=31536000",
          contentType: uploadFile.type || "image/jpeg",
        });
        return getDownloadURL(imageRef);
      } catch (uploadError) {
        throw new Error(getStorageUploadErrorMessage(uploadError));
      }
    }
    if (isFirebaseConfigured) {
      throw new Error("Profile photo uploads are disabled until Firebase Storage is enabled.");
    }
    return fileToDataUrl(uploadFile);
  };

  const sendMessage = async (receiverId: string, body: string) => {
    if (!currentUser) throw new Error("Sign in to send messages.");
    const state = getConnectionState(receiverId, currentUser.id, connections);
    if (state.state !== "connected") throw new Error("You can message accepted connections only.");

    const message: Message = {
      id: newId("message"),
      senderId: currentUser.id,
      receiverId,
      body: body.trim(),
      createdAt: nowIso(),
    };
    if (!message.body) throw new Error("Write a message first.");

    if (db) {
      await setDoc(doc(db, "messages", message.id), message);
    } else {
      setMessages((previous) => [...previous, message]);
    }

    await createNotification(receiverId, "message", `${currentUser.fullName} sent you a message.`);
  };

  const seedDemoData = async () => {
    const seed = createSeedStore();
    const firestore = db;
    if (firestore) {
      const batch = writeBatch(firestore);
      const seedUsers = currentUser
        ? [currentUser, ...seed.users.filter((user) => user.id !== currentUser.id)]
        : seed.users;
      seedUsers.forEach((user) => batch.set(doc(firestore, "users", user.id), user));
      seed.connections.forEach((connection) =>
        batch.set(doc(firestore, "connections", connection.id), connection)
      );
      seed.opportunities.forEach((opportunity) =>
        batch.set(doc(firestore, "opportunities", opportunity.id), opportunity)
      );
      seed.listings.forEach((listing) =>
        batch.set(doc(firestore, "listings", listing.id), listing)
      );
      seed.notifications.forEach((notification) =>
        batch.set(doc(firestore, "notifications", notification.id), notification)
      );
      seed.messages.forEach((message) => batch.set(doc(firestore, "messages", message.id), message));
      await batch.commit();
      return;
    }

    setAccounts(seed.accounts);
    const preservedUserId = currentUser?.id;
    setCurrentUserId(
      preservedUserId && seed.users.some((user) => user.id === preservedUserId)
        ? preservedUserId
        : "admin-demo"
    );
    setUsers(seed.users);
    setConnections(seed.connections);
    setOpportunities(seed.opportunities);
    setListings(seed.listings);
    setNotifications(seed.notifications);
    setMessages(seed.messages);
  };

  if (!isOnline) {
    return <OfflineScreen />;
  }

  if (!authReady) {
    return <FullScreenLoader label="Loading Konnekt" />;
  }

  if (!currentUserId) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" firebaseEnabled={isFirebaseConfigured} onLogin={handleLogin} onRegister={handleRegister} onReset={handlePasswordReset} onSocialLogin={handleSocialLogin} onDemoLogin={handleDemoLogin} />} />
        <Route path="/register" element={<AuthPage mode="register" firebaseEnabled={isFirebaseConfigured} onLogin={handleLogin} onRegister={handleRegister} onReset={handlePasswordReset} onSocialLogin={handleSocialLogin} onDemoLogin={handleDemoLogin} />} />
        <Route path="/reset" element={<AuthPage mode="reset" firebaseEnabled={isFirebaseConfigured} onLogin={handleLogin} onRegister={handleRegister} onReset={handlePasswordReset} onSocialLogin={handleSocialLogin} onDemoLogin={handleDemoLogin} />} />
        <Route path="/" element={<LandingPage listings={listings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (loadingData && !currentUser) {
    return <FullScreenLoader label="Preparing your professional network" />;
  }

  if (!currentUser) {
    return <FullScreenLoader label="Preparing your profile" />;
  }

  if (currentUser.suspended) {
    return <SuspendedScreen onLogout={handleLogout} />;
  }

  const profilePhotoUploadAvailable =
    !isFirebaseConfigured ||
    (Boolean(storage) && import.meta.env.VITE_ENABLE_FIREBASE_STORAGE === "true");

  return (
    <AppShell currentUser={currentUser} unreadNotifications={unreadNotifications} onLogout={handleLogout}>
      {runtimeError ? (
        <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span>{runtimeError}</span>
            <button className="font-semibold" type="button" onClick={() => setRuntimeError("")}>Dismiss</button>
          </div>
        </div>
      ) : null}
      <Routes>
        <Route path="/" element={<DashboardPage currentUser={currentUser} users={users} connections={connections} opportunities={opportunities} listings={listings} notifications={notifications} loading={loadingData} onConnect={handleSendConnection} onRespondConnection={handleRespondConnection} onMarkNotificationRead={markNotificationRead} onCreateListing={createListing} />} />
        <Route path="/network" element={<NetworkPage currentUser={currentUser} users={users} connections={connections} onConnect={handleSendConnection} onRespondConnection={handleRespondConnection} />} />
        <Route path="/opportunities" element={<OpportunitiesPage currentUser={currentUser} users={users} opportunities={opportunities} onCreateOpportunity={createOpportunity} onDeleteOpportunity={deleteOpportunity} />} />
        <Route path="/opportunity/:opportunityId" element={<OpportunityDetailsPage currentUser={currentUser} users={users} opportunities={opportunities} />} />
        <Route path="/profile" element={<ProfilePage profile={currentUser} currentUser={currentUser} connections={connections} opportunities={opportunities} onSaveProfile={saveUserProfile} onUploadPhoto={uploadProfilePhoto} profilePhotoUploadAvailable={profilePhotoUploadAvailable} onConnect={handleSendConnection} onRespondConnection={handleRespondConnection} />} />
        <Route path="/profile/:profileId" element={<ProfilePageWrapper currentUser={currentUser} users={users} connections={connections} opportunities={opportunities} onSaveProfile={saveUserProfile} onUploadPhoto={uploadProfilePhoto} profilePhotoUploadAvailable={profilePhotoUploadAvailable} onConnect={handleSendConnection} onRespondConnection={handleRespondConnection} />} />
        <Route path="/notifications" element={<NotificationsPage currentUser={currentUser} notifications={notifications} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} />} />
        <Route path="/messages/:contactId?" element={<MessagesPage currentUser={currentUser} users={users} connections={connections} messages={messages} onSendMessage={sendMessage} />} />
        <Route path="/settings" element={<SettingsPage currentUser={currentUser} firebaseEnabled={isFirebaseConfigured} storageEnabled={Boolean(storage) && import.meta.env.VITE_ENABLE_FIREBASE_STORAGE === "true"} onLogout={handleLogout} />} />
        <Route path="/admin" element={isAdminUser(currentUser) ? <AdminPage currentUser={currentUser} users={users} connections={connections} opportunities={opportunities} listings={listings} messages={messages} notifications={notifications} onSaveUser={saveUserProfile} onApproveOpportunity={approveOpportunity} onDeleteOpportunity={deleteOpportunity} onApproveListing={approveListing} onDeleteListing={deleteListing} onSeedDemoData={seedDemoData} /> : <AccessDenied currentUser={currentUser} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/reset" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

function ProfilePageWrapper({
  currentUser,
  users,
  connections,
  opportunities,
  onSaveProfile,
  onUploadPhoto,
  profilePhotoUploadAvailable,
  onConnect,
  onRespondConnection,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  opportunities: Opportunity[];
  onSaveProfile: (userId: string, patch: Partial<UserProfile>) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<string>;
  profilePhotoUploadAvailable: boolean;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const { profileId } = useRouterParams<{ profileId: string }>();
  const resolvedId = profileId || currentUser.id;
  const profile = users.find((user) => user.id === resolvedId && !user.suspended) ?? null;
  return (
    <ProfilePage
      profile={profile}
      currentUser={currentUser}
      connections={connections}
      opportunities={opportunities}
      onSaveProfile={onSaveProfile}
      onUploadPhoto={onUploadPhoto}
      profilePhotoUploadAvailable={profilePhotoUploadAvailable}
      onConnect={onConnect}
      onRespondConnection={onRespondConnection}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
