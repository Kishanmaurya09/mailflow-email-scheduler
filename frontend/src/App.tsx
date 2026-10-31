import Sidebar from "./components/Sidebar";
import Auth from "./components/Auth";
import StatsCard from "./components/StatsCard";
import { useState, useEffect } from "react";
import "./App.css";

type EmailJob = {
  id: string;
  to: string;
  subject: string;
  status: string;
  body?: string;
  delayInSeconds?: number;
};

function App() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("60");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([]);
const [loadingHistory, setLoadingHistory] = useState(false);
  type EmailHistoryItem = {
  _id: string;
  to: string;
  subject: string;
  status: string;
  scheduledAt: string;
  completedAt?: string;
};
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingJob, setEditingJob] = useState<EmailJob | null>(null);
  const [viewingJob, setViewingJob] = useState<EmailJob | null>(null);
  const [token, setToken] = useState<string | null>(
  () => localStorage.getItem("token")
);
const [activePage, setActivePage] = useState("Emails");

  const [user, setUser] = useState<{
  name: string;
  email: string;
} | null>(() => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
});
const [profileOpen, setProfileOpen] = useState(false);

  function resetForm() {
    setEditingJob(null);
    setTo("");
    setSubject("");
    setBody("");
    setDelay("60");
  }

  async function handleSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const isEditing = editingJob !== null;

      const url = isEditing
        ? `http://localhost:3000/scheduled-emails/${editingJob.id}`
        : "http://localhost:3000/schedule-email";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
        body: JSON.stringify({
          to,
          subject,
          body,
          delayInSeconds: Number(delay),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save email");
      }

      setMessage(`✅ ${data.message} | Job ID: ${data.jobId}`);
      resetForm();
      await fetchJobs();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobs() {
    setFetchingJobs(true);

    try {
      const response = await fetch(
  "http://localhost:3000/scheduled-emails",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load emails");
      }

      setJobs(data.jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setFetchingJobs(false);
    }
  }

  async function fetchEmailHistory() {
  setLoadingHistory(true);

  try {
    const response = await fetch(
      "http://localhost:3000/email-history",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load email history");
    }

    setEmailHistory(data.history);
  } catch (error) {
    console.error("Error fetching email history:", error);
  } finally {
    setLoadingHistory(false);
  }
}

  async function cancelJob(id: string) {
    if (!window.confirm(`Cancel scheduled email ${id}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/scheduled-emails/${id}`,
        {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  },
},
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel email");
      }

      setMessage(`✅ ${data.message}`);
      await fetchJobs();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Could not cancel email",
      );
    }
  }

  
async function deleteEmailHistory(id: string) {
  if (!window.confirm("Delete this email from history permanently?")) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/scheduled-emails/${id}/history`,
      {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  },
},
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete email history");
    }

    if (viewingJob?.id === id) {
      setViewingJob(null);
    }

    setMessage(`✅ ${data.message}`);
    await fetchJobs();
  } catch (error) {
    setMessage(
      error instanceof Error
        ? `❌ ${error.message}`
        : "❌ Could not delete email history",
    );
  }
}


  function startEditing(job: EmailJob) {
    setEditingJob(job);
    setTo(job.to);
    setSubject(job.subject);
    setBody(job.body ?? "");
    setDelay(String(job.delayInSeconds ?? 60));
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  
async function viewEmail(id: string) {
  try {
    const response = await fetch(
  `http://localhost:3000/scheduled-emails/${id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load email");
    }

    setViewingJob(data.email);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? `❌ ${error.message}`
        : "❌ Failed to load email",
    );
  }
}


  useEffect(() => {
  if (!token) {
    setJobs([]);
    return;
  }

  void fetchJobs();

  const interval = setInterval(() => {
    void fetchJobs();
  }, 5000);

  return () => clearInterval(interval);
}, [token]);

useEffect(() => {
  if (token && activePage === "Email History") {
    void fetchEmailHistory();
  }
}, [token, activePage]);

  const totalEmails = jobs.length;

const scheduledEmails = jobs.filter(
  (job) => job.status === "waiting" || job.status === "delayed"
).length;

const completedEmails = jobs.filter(
  (job) => job.status === "completed"
).length;

const failedEmails = jobs.filter(
  (job) => job.status === "failed"
).length;

  const filteredJobs = jobs.filter((job) => {
  const matchesStatus =
    statusFilter === "all" || job.status === statusFilter;

  const query = searchQuery.trim().toLowerCase();

  const matchesSearch =
    job.to.toLowerCase().includes(query) ||
    job.subject.toLowerCase().includes(query) ||
    job.id.toLowerCase().includes(query);

  return matchesStatus && matchesSearch;
});

if (!token) {
  return (
    <Auth
      onLogin={(newToken, loggedInUser) => {
        setToken(newToken);
        localStorage.setItem("token", newToken);
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
      }}
    />
  );
}

   return (
    
  <main className="flex min-h-screen bg-slate-950 text-white">
    <Sidebar
      activePage={activePage}
      onNavigate={setActivePage}
    />

    <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">

        {activePage === "Dashboard" && (
  <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
    <p className="mt-2 text-slate-400">
      Welcome to your Email Scheduler dashboard.
    </p>
  </div>
)}


{activePage === "Email History" && (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <div className="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-white">Email History</h1>
        <p className="mt-2 text-sm text-slate-400">
          View your previously scheduled and delivered emails.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void fetchEmailHistory()}
        disabled={loadingHistory}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loadingHistory ? "Loading..." : "Refresh"}
      </button>
    </div>

    {loadingHistory && emailHistory.length === 0 ? (
      <p className="text-sm text-slate-400">Loading email history...</p>
    ) : emailHistory.length === 0 ? (
      <p className="rounded-lg border border-slate-800 p-4 text-sm text-slate-400">
        No email history found.
      </p>
    ) : (
      <div className="email-history-scroll overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-slate-400">
            <tr>
              <th className="px-3 py-3">Recipient</th>
              <th className="px-3 py-3">Subject</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Scheduled At</th>
            </tr>
          </thead>
          <tbody>
            {emailHistory.map((email) => (
              <tr key={email._id} className="border-b border-slate-800">
                <td className="px-3 py-3 text-slate-300">{email.to}</td>
                <td className="px-3 py-3 text-white">{email.subject}</td>
                <td className="px-3 py-3 capitalize text-indigo-400">
                  {email.status}
                </td>
                <td className="px-3 py-3 text-slate-400">
                  {new Date(email.scheduledAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}




      {activePage === "Emails" && (
        <>
<header className="animate-fade-up mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4">
  <div>
    <p className="text-xs font-semibold tracking-widest text-indigo-400">
      EMAIL AUTOMATION
    </p>
    <h1 className="mt-1 text-2xl font-bold tracking-tight">
      Email Scheduler
    </h1>
    <p className="mt-1 text-sm text-slate-400">
      Schedule emails and manage your delivery workflow.
    </p>
  </div>

  <div className="relative">
    <button
      type="button"
      onClick={() => setProfileOpen(!profileOpen)}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold hover:bg-indigo-500"
      aria-label="Open profile menu"
    >
      {user?.name?.charAt(0).toUpperCase() || "U"}
    </button>

    {profileOpen && (
      <div className="absolute right-0 top-14 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <p className="font-semibold text-white">
          {user?.name}
        </p>
        <p className="mt-1 break-all text-sm text-slate-400">
          {user?.email}
        </p>

        <div className="my-3 border-t border-slate-700" />

        <button
          type="button"
          onClick={() => {
            setProfileOpen(false);
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }}
          className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          Logout
        </button>
      </div>
    )}
  </div>
</header>

        <div className="animate-fade-up mx-auto mb-5 grid w-full max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4">
  <StatsCard title="Total Emails" value={totalEmails} color="text-indigo-400" />
  <StatsCard title="Scheduled" value={scheduledEmails} color="text-amber-400" />
  <StatsCard title="Completed" value={completedEmails} color="text-emerald-400" />
  <StatsCard title="Failed" value={failedEmails} color="text-red-400" />
</div>

        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          <section className="animate-fade-up hover-lift min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-5 text-lg font-semibold">
              {editingJob ? "Edit scheduled email" : "Schedule an email"}
            </h2>

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Recipient email
                </label>
                <input
                  type="email"
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Subject
                </label>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email..."
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Send after (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={delay}
                  onChange={(e) => setDelay(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-indigo-600 p-2.5 text-sm font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingJob
                      ? "Save Changes"
                      : "Schedule Email"}
                </button>

                {editingJob && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMessage("");
                    }}
                    className="rounded-lg border border-slate-700 px-3 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {message && (
                <p
                  className="break-words text-sm text-slate-300"
                  role="status"
                >
                  {message}
                </p>
              )}
            </form>
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <section className="animate-fade-up hover-lift flex-1 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Queue system</p>
              <h2 className="mt-2 text-xl font-semibold">BullMQ + Redis</h2>
              <p className="mt-3 text-sm text-emerald-400">
                ● Backend queue configured
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Handles delayed jobs and processes scheduled email tasks.
              </p>
            </section>

            <section className="animate-fade-up hover-lift flex-1 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">SMTP testing</p>
              <h2 className="mt-2 text-xl font-semibold">Ethereal Email</h2>
              <p className="mt-3 text-sm text-slate-400">
                Open the preview URL from your worker terminal to inspect test
                emails.
              </p>
            </section>
          </aside>

          <section className="animate-fade-up hover-lift min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Scheduled Emails</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {jobs.length} jobs in queue history
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchJobs()}
                disabled={fetchingJobs}
                className="smooth-button shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
              >
                {fetchingJobs ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {[
                "all",
                "waiting",
                "delayed",
                "active",
                "completed",
                "failed",
              ].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs capitalize transition ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {status === "all" ? "All" : status}
                </button>
              ))}
            </div>

                        <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipient, subject, or Job ID..."
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-cyan-500"
            />

            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {filteredJobs.length === 0 ? (
                <p className="rounded-lg border border-slate-800 p-4 text-sm text-slate-400">
                  No emails found for this status.
                </p>
              ) : (
                filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="min-w-0 rounded-lg border border-slate-800 p-3"
                  >
                    <p className="break-words text-sm font-semibold">
                      {job.subject}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-400">
                      {job.to}
                    </p>

                    <button
  type="button"
  onClick={() => void viewEmail(job.id)}
  className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20"
>
  View Email
</button>

                    <p className="mt-2 text-xs text-slate-500">
                      Job ID: {job.id}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          job.status === "delayed"
                            ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                            : job.status === "waiting"
                              ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                              : job.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                                : job.status === "failed"
                                  ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                                  : "bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50"
                        }`}
                      >
                        {job.status}
                      </span>

                      {["waiting", "delayed"].includes(job.status) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(job)}
                            className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void cancelJob(job.id)}
                            className="smooth-button rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                          >
                            Cancel email
                          </button>
                        </div>
                      )}
                    </div>
                    {["completed", "failed"].includes(job.status) && (
  <button
    type="button"
    onClick={() => void deleteEmailHistory(job.id)}
    className="mt-3 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
  >
    Delete history
  </button>
)}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
        </>
        )}
      </div>
    
    </div>
    

    {viewingJob && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    onClick={() => setViewingJob(null)}
  >
    <div
      className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Email Details</h2>
        <button
          type="button"
          onClick={() => setViewingJob(null)}
          className="rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400">Recipient</p>
          <p className="mt-1 break-all text-sm text-white">{viewingJob.to}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Subject</p>
          <p className="mt-1 break-words text-sm text-white">
            {viewingJob.subject}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Message</p>
          <div className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
            {viewingJob.body || "No message available"}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Job ID: {viewingJob.id} · Status: {viewingJob.status}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setViewingJob(null)}
        className="mt-6 w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
      >
        Close
      </button>
    </div>
  </div>
)}
</main>

  );
}

export default App;