import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Connection, Message, UserProfile } from "@/types";
import { getConnectedProfiles, relativeTime } from "@/utils/helpers";
import { cn } from "@/utils/cn";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Button, EmptyState, ErrorMessage, Panel, SectionTitle } from "@/components/ui";

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-sm", isOwn ? "rounded-br-md bg-[#0B6B3A] text-white" : "rounded-bl-md bg-white text-slate-700")}>
        <p className="leading-6">{message.body}</p>
        <p className={cn("mt-1 text-[11px]", isOwn ? "text-white/70" : "text-slate-400")}>{relativeTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

export function MessagesPage({
  currentUser,
  users,
  connections,
  messages,
  onSendMessage,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  messages: Message[];
  onSendMessage: (receiverId: string, body: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { contactId: routeContactId } = useParams<{ contactId: string }>();
  const contacts = useMemo(() => getConnectedProfiles(currentUser.id, users, connections), [currentUser.id, users, connections]);
  const [selectedId, setSelectedId] = useState(routeContactId || contacts[0]?.id || "");
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeContactId && contacts.some((contact) => contact.id === routeContactId)) {
      setSelectedId(routeContactId);
      return;
    }
    if (!selectedId && contacts[0]) setSelectedId(contacts[0].id);
    if (selectedId && !contacts.some((contact) => contact.id === selectedId)) setSelectedId(contacts[0]?.id || "");
  }, [contacts, routeContactId, selectedId]);

  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? null;
  const thread = selectedContact
    ? messages
        .filter(
          (message) =>
            (message.senderId === currentUser.id && message.receiverId === selectedContact.id) ||
            (message.senderId === selectedContact.id && message.receiverId === currentUser.id)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedContact) return;
    setError("");
    try {
      await onSendMessage(selectedContact.id, messageBody);
      setMessageBody("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
    }
  };

  if (!contacts.length) {
    return (
      <EmptyState
        title="No message contacts yet"
        description="Accept or create a connection before starting a one-to-one message."
        action={<Button onClick={() => navigate("/network")}>Find connections</Button>}
      />
    );
  }

  return (
    <div className="grid min-h-[70vh] gap-5 pb-20 lg:grid-cols-[0.75fr_1.25fr] lg:pb-0">
      <Panel className="p-4">
        <SectionTitle title="Messages" />
        <div className="mt-4 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl p-3 text-left transition",
                selectedContact?.id === contact.id ? "bg-[#0B6B3A] text-white" : "hover:bg-[#F8FAF9]"
              )}
              type="button"
              onClick={() => {
                setSelectedId(contact.id);
                navigate(`/messages/${contact.id}`);
              }}
            >
              <Avatar user={contact} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{contact.fullName}</span>
                <span className={cn("block truncate text-xs", selectedContact?.id === contact.id ? "text-white/70" : "text-slate-500")}>{contact.professionalTitle}</span>
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="flex min-h-[70vh] flex-col overflow-hidden p-0">
        {selectedContact ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <Avatar user={selectedContact} />
                <div>
                  <h1 className="font-heading text-lg font-bold text-[#142019]">{selectedContact.fullName}</h1>
                  <p className="text-sm text-slate-500">{selectedContact.professionalTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/profile/${selectedContact.id}`)}>Profile</Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAF9] p-5">
              {thread.length ? (
                thread.map((message) => (
                  <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUser.id} />
                ))
              ) : (
                <EmptyState title="Start the conversation" description="Send a concise professional message to move the connection forward." />
              )}
            </div>
            <form className="sticky bottom-0 border-t border-slate-100 bg-white p-4" onSubmit={submitMessage}>
              {error ? <ErrorMessage message={error} /> : null}
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B6B3A]"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Write a professional message"
                />
                <Button type="submit">Send</Button>
              </div>
            </form>
          </>
        ) : null}
      </Panel>
    </div>
  );
}
