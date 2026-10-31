import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import MessageContent from "./MessageContent";
import "./App.css";

/* =========================================================
   DevPilotAI — Multi-tool AI workspace

   Frontend:
   - React + TypeScript
   - Existing App.css

   Backend:
   - FastAPI
   - Default URL: http://127.0.0.1:8082

   Change VITE_API_URL in frontend/.env if needed.
   ========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

const storageKeysForUser = (userId: string) => {
  const prefix = `devpilot:${userId}`;
  return {
    activePage: `${prefix}:active-page`,
    conversations: `${prefix}:conversations`,
    activeConversation: `${prefix}:active-conversation`,
    displayName: `${prefix}:display-name`,
  };
};

type PageId =
  | "overview"
  | "assistant"
  | "code"
  | "github"
  | "integrations"
  | "settings";

type MessageRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
};

type GitHubUser = {
  login?: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
  bio?: string | null;
  public_repos?: number;
  followers?: number;
};

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  html_url: string;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  private?: boolean;
  updated_at?: string;
  default_branch?: string;
};

type GitHubStatus = {
  connected: boolean;
  scope?: string;
  login?: string;
  username?: string;
  user?: GitHubUser;
  profile?: GitHubUser;
  message?: string;
};

type GoogleStatus = { connected: boolean; scope?: string };

type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "checking"
  | "unavailable"
  | "coming-soon";

type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  status: IntegrationStatus;
  detail: string;
  connectPath?: string;
  websiteUrl?: string;
  setupHint: string;
};

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

type AuthUser = {
  id?: string;
  email?: string;
  user_metadata?: { display_name?: string };
};

const NAVIGATION: {
  heading: string;
  items: { id: PageId; label: string; icon: string; badge?: string; serviceId?: string }[];
}[] = [
  {
    heading: "WORKSPACE",
    items: [
      { id: "overview", label: "Overview", icon: "◫" },
      { id: "assistant", label: "AI Assistant", icon: "✳" },
      { id: "code", label: "Code Assistant", icon: "</>" },
    ],
  },
  {
    heading: "DEVELOPMENT",
    items: [
      { id: "github", label: "GitHub", icon: "⌘" },
      { id: "integrations", label: "Integrations", icon: "⧉", badge: "7" },
    ],
  },
  {
    heading: "CONNECTED SERVICES",
    items: [
      { id: "integrations", label: "Google", icon: "G", serviceId: "google" },
      { id: "integrations", label: "Gmail", icon: "✉", serviceId: "gmail" },
      { id: "integrations", label: "Calendar", icon: "◷", serviceId: "calendar" },
      { id: "github", label: "GitHub", icon: "⌘", serviceId: "github" },
      { id: "integrations", label: "Notion", icon: "N", serviceId: "notion" },
      { id: "integrations", label: "Instagram", icon: "◎", serviceId: "instagram" },
      { id: "integrations", label: "Snapchat", icon: "👻", serviceId: "snapchat" },
      { id: "integrations", label: "Supabase", icon: "ϟ", serviceId: "supabase" },
    ],
  },
  {
    heading: "PREFERENCES",
    items: [{ id: "settings", label: "Settings", icon: "⚙" }],
  },
];

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "google",
    name: "Google",
    category: "Identity",
    description: "Connect Google services and account-based workflows.",
    icon: "G",
    color: "#4285F4",
    status: "disconnected",
    detail: "Not connected",
    connectPath: "/auth/google/login",
    websiteUrl: "https://www.google.com",
    setupHint: "Configure Google OAuth credentials and a backend callback.",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Email",
    description: "Prepare an integration for email search and management.",
    icon: "✉",
    color: "#EA4335",
    status: "disconnected",
    detail: "Not connected",
    connectPath: "/auth/google/login",
    websiteUrl: "https://mail.google.com",
    setupHint:
      "Configure Google OAuth with Gmail API scopes and request consent.",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Productivity",
    description: "View schedules and create or update calendar events.",
    icon: "◷",
    color: "#4285F4",
    status: "disconnected",
    detail: "Not connected",
    connectPath: "/auth/google/login",
    websiteUrl: "https://calendar.google.com",
    setupHint: "Enable the Google Calendar API and authorize Calendar scopes.",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Development",
    description: "Explore repositories and connect developer workflows.",
    icon: "⌘",
    color: "#E8EAF0",
    status: "checking",
    detail: "Checking backend",
    connectPath: "/auth/github/login",
    websiteUrl: "https://github.com",
    setupHint:
      "Configure GitHub OAuth and the backend GitHub status endpoint.",
  },
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    description: "Prepare workspace, pages, and knowledge-base integration.",
    icon: "N",
    color: "#E8EAF0",
    status: "disconnected",
    detail: "Not connected",
    connectPath: "/auth/notion/login",
    websiteUrl: "https://www.notion.so",
    setupHint: "Configure a Notion integration and OAuth callback.",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Social",
    description: "Prepare supported Instagram account and publishing workflows.",
    icon: "◎",
    color: "#E879F9",
    status: "disconnected",
    detail: "Not connected",
    connectPath: "/auth/instagram/login",
    websiteUrl: "https://www.instagram.com",
    setupHint:
      "Configure supported Meta authentication, permissions, and review requirements.",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    category: "Social",
    description: "Prepare supported Snapchat account integrations.",
    icon: "👻",
    color: "#FDE047",
    status: "disconnected",
    detail: "Not connected",
    connectPath: "/auth/snapchat/login",
    websiteUrl: "https://accounts.snapchat.com/accounts/login",
    setupHint:
      "Configure an approved Snap developer application and supported OAuth scopes.",
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "Database",
    description: "Connect application data and authentication workflows.",
    icon: "ϟ",
    color: "#3ECF8E",
    status: "disconnected",
    detail: "Not connected",
    websiteUrl: "https://supabase.com/dashboard",
    setupHint:
      "Configure Supabase project credentials and a backend health/status endpoint.",
  },
];

const STARTER_PROMPTS = [
  {
    icon: "⌘",
    title: "Understand a codebase",
    description: "Explain architecture, files, and execution flow.",
    prompt:
      "Help me understand a codebase. Give me a structured approach to inspect its architecture, important files, dependencies, and execution flow.",
  },
  {
    icon: "⚡",
    title: "Build a feature",
    description: "Plan and implement a feature step by step.",
    prompt:
      "Help me plan a new software feature. Start by clarifying the requirements, then suggest the architecture, implementation steps, and tests.",
  },
  {
    icon: "⌕",
    title: "Debug an issue",
    description: "Find likely causes and practical fixes.",
    prompt:
      "Help me debug an issue. Ask me for the error message, relevant code, environment, and steps to reproduce it before suggesting a fix.",
  },
  {
    icon: "✳",
    title: "Explore AI tools",
    description: "Design an AI-powered development workflow.",
    prompt:
      "Help me design an AI-powered development workflow using an AI assistant, a code assistant, GitHub, and a FastAPI backend.",
  },
];

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createMessage = (
  role: MessageRole,
  content: string
): ChatMessage => ({
  id: createId(),
  role,
  content,
  createdAt: new Date().toISOString(),
});

const createConversation = (): Conversation => ({
  id: createId(),
  title: "New conversation",
  messages: [],
  updatedAt: new Date().toISOString(),
});

function readStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      credentials: "include",
    });

    const text = await response.text();

    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "detail" in data &&
        typeof data.detail === "string"
          ? data.detail
          : `Request failed with status ${response.status}`;

      return {
        ok: false,
        status: response.status,
        data: data as T,
        error: message,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error:
        getErrorMessage(error) ||
        "Cannot reach the backend. Check the server and CORS settings.",
    };
  }
}

function formatRelativeDate(date?: string): string {
  if (!date) return "Recently";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "Recently";

  const difference = Date.now() - timestamp;
  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

function getPageTitle(page: PageId): string {
  const titles: Record<PageId, string> = {
    overview: "Overview",
    assistant: "AI Assistant",
    code: "Code Assistant",
    github: "GitHub workspace",
    integrations: "Integrations",
    settings: "Settings",
  };

  return titles[page];
}

/* =========================================================
   Small reusable UI components
   ========================================================= */

function Icon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`dp-icon ${className}`}>{children}</span>;
}

function StatusDot({
  status,
}: {
  status: IntegrationStatus | "online" | "offline";
}) {
  const active = status === "connected" || status === "online";
  const waiting = status === "checking";

  return (
    <span
      className={[
        "dp-status-dot",
        active ? "is-online" : "",
        waiting ? "is-checking" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      className={`dp-button dp-button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="dp-empty-state">
      <div className="dp-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

/* =========================================================
   Main application
   ========================================================= */

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("overview");

  const [displayName, setDisplayName] = useState("Developer");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() => [
    createConversation(),
  ]);

  const [activeConversationId, setActiveConversationId] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const authBootstrappedRef = useRef(false);

  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(
    null
  );
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [repoSearch, setRepoSearch] = useState("");

  const [integrations, setIntegrations] = useState<Integration[]>(
    INITIAL_INTEGRATIONS
  );

  const [integrationFilter, setIntegrationFilter] = useState("All");

  const [settingsSaved, setSettingsSaved] = useState(false);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ) || conversations[0],
    [conversations, activeConversationId]
  );

  const currentMessages = activeConversation?.messages ?? [];

  const connectedCount = integrations.filter(
    (integration) => integration.status === "connected"
  ).length;

  const visibleRepositories = useMemo(() => {
    const query = repoSearch.trim().toLowerCase();

    if (!query) return repositories;

    return repositories.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description || "").toLowerCase().includes(query) ||
        (repo.language || "").toLowerCase().includes(query)
      );
    });
  }, [repositories, repoSearch]);

  const visibleIntegrations = useMemo(() => {
    if (integrationFilter === "All") return integrations;

    if (integrationFilter === "Connected") {
      return integrations.filter(
        (integration) => integration.status === "connected"
      );
    }

    if (integrationFilter === "Not connected") {
      return integrations.filter(
        (integration) =>
          integration.status === "disconnected" ||
          integration.status === "unavailable"
      );
    }

    return integrations.filter(
      (integration) => integration.category === integrationFilter
    );
  }, [integrations, integrationFilter]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const loadUserWorkspace = useCallback((user: AuthUser, openDashboard: boolean) => {
    if (!user.id) return;

    const keys = storageKeysForUser(user.id);
    const savedConversations = readStorage<Conversation[]>(keys.conversations, []);
    const nextConversations = savedConversations.length ? savedConversations : [createConversation()];
    const savedPage = localStorage.getItem(keys.activePage) as PageId | null;
    const allowedPages: PageId[] = ["overview", "assistant", "code", "github", "integrations", "settings"];
    const preferredName = user.user_metadata?.display_name || localStorage.getItem(keys.displayName) || user.email?.split("@")[0] || "Developer";

    setConversations(nextConversations);
    setActiveConversationId(localStorage.getItem(keys.activeConversation) || nextConversations[0].id);
    setDisplayName(preferredName);
    setActivePage(openDashboard || !allowedPages.includes(savedPage as PageId) ? "overview" : savedPage as PageId);
  }, []);

  useEffect(() => {
    // Avoid sending confirmation or session-status requests twice when
    // React Strict Mode re-runs effects during local development.
    if (authBootstrappedRef.current) return;
    authBootstrappedRef.current = true;

    void (async () => {
      // Supabase email-confirmation links return the temporary access token in
      // the URL fragment. Exchange it before checking an existing session.
      const confirmationParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = confirmationParams.get("access_token");

      if (accessToken) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        const result = await apiRequest<{ signed_in: boolean; user?: AuthUser }>("/api/auth/confirm", {
          method: "POST",
          body: JSON.stringify({ access_token: accessToken }),
        });

        if (result.ok && result.data?.signed_in) {
          setAuthUser(result.data.user || null);
          const profileName = result.data.user?.user_metadata?.display_name;
          if (profileName) setDisplayName(profileName);
          setSignedIn(true);
          loadUserWorkspace(result.data.user || {}, true);
          setAuthReady(true);
          return;
        }

        setAuthError(result.error || "We could not finish verifying this email. Request a new verification link.");
      }

      // Restore a valid session after a normal browser refresh.
      const result = await apiRequest<{ signed_in: boolean; user?: AuthUser }>("/api/auth/status");
      if (result.ok && result.data?.signed_in) {
        setAuthUser(result.data.user || null);
        setSignedIn(true);
        loadUserWorkspace(result.data.user || {}, false);
      } else {
        setSignedIn(false);
      }
      setAuthReady(true);
    })();
  }, [loadUserWorkspace]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>, action: "login" | "signup") => {
    event.preventDefault();
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    const data = new FormData(event.currentTarget);
    const result = await apiRequest<{ signed_in: boolean; message?: string; user?: AuthUser }>(`/api/auth/${action}`, {
      method: "POST", body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
        display_name: data.get("displayName"),
      }),
    });
    setAuthBusy(false);
    if (!result.ok) { setAuthError(result.error || "Authentication failed."); return; }
    if (result.data?.signed_in) {
      setAuthUser(result.data.user || null);
      setSignedIn(true);
      loadUserWorkspace(result.data.user || {}, true);
    } else {
      setAuthMessage(result.data?.message || "Check your email, then sign in.");
      setAuthMode("login");
    }
  };

  const logout = useCallback(async () => {
    setAuthBusy(true);
    await apiRequest("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setSignedIn(false);
    setActivePage("overview");
    setDisplayName("Developer");
    setConversations([createConversation()]);
    setActiveConversationId("");
    setAuthBusy(false);
  }, []);

  const navigate = useCallback((page: PageId) => {
    setActivePage(page);
    setMobileSidebarOpen(false);
    setSearchQuery("");
  }, []);

  const updateIntegration = useCallback(
    (id: string, changes: Partial<Integration>) => {
      setIntegrations((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...changes } : item
        )
      );
    },
    []
  );

  const updateConversation = useCallback(
    (id: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === id ? updater(conversation) : conversation
        )
      );
    },
    []
  );

  /* Persist workspace state. */

  const currentUserStorage = authUser?.id ? storageKeysForUser(authUser.id) : null;

  useEffect(() => {
    if (signedIn && currentUserStorage) {
      localStorage.setItem(currentUserStorage.conversations, JSON.stringify(conversations));
    }
  }, [conversations, currentUserStorage, signedIn]);

  useEffect(() => {
    if (signedIn && currentUserStorage && activeConversationId) {
      localStorage.setItem(currentUserStorage.activeConversation, activeConversationId);
    }
  }, [activeConversationId, currentUserStorage, signedIn]);

  useEffect(() => {
    if (signedIn && currentUserStorage) {
      localStorage.setItem(currentUserStorage.displayName, displayName);
    }
  }, [currentUserStorage, displayName, signedIn]);

  useEffect(() => {
    if (signedIn && currentUserStorage) {
      localStorage.setItem(currentUserStorage.activePage, activePage);
    }
  }, [activePage, currentUserStorage, signedIn]);

  useEffect(() => {
    if (
      conversations.length > 0 &&
      !conversations.some(
        (conversation) => conversation.id === activeConversationId
      )
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (!conversations.length) {
      const conversation = createConversation();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversations([conversation]);
      setActiveConversationId(conversation.id);
    }
  }, [conversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, chatLoading]);

  /* Health check. */

  const checkBackend = useCallback(async () => {
    setBackendStatus("checking");

    const result = await apiRequest<{
      status?: string;
      message?: string;
    }>("/health");

    setBackendStatus(result.ok ? "online" : "offline");
  }, []);

  /* GitHub status and repository loading. */

  const checkGitHub = useCallback(async () => {
    updateIntegration("github", {
      status: "checking",
      detail: "Checking backend",
    });

    const result = await apiRequest<GitHubStatus>("/api/github/status");

    if (!result.ok || !result.data) {
      setGithubStatus(null);

      updateIntegration("github", {
        status: result.status === 0 ? "unavailable" : "disconnected",
        detail:
          result.status === 0
            ? "Backend unavailable"
            : "Not connected or status endpoint unavailable",
      });

      return;
    }

    const data = result.data;

    setGithubStatus(data);

    const profile = data.user || data.profile || null;
    setGithubUser(profile);

    if (data.connected) {
      updateIntegration("github", {
        status: "connected",
        detail: data.login || data.username || profile?.login || "Connected",
      });
    } else {
      updateIntegration("github", {
        status: "disconnected",
        detail: "Not connected",
      });
    }
  }, [updateIntegration]);

  const checkGoogle = useCallback(async () => {
    const result = await apiRequest<GoogleStatus>("/api/google/status");
    const connected = Boolean(result.ok && result.data?.connected);
    for (const id of ["google", "gmail", "calendar"]) {
      updateIntegration(id, {
        status: connected ? "connected" : "disconnected",
        detail: connected ? "Connected" : "Not connected",
      });
    }
  }, [updateIntegration]);

  const loadRepositories = useCallback(async () => {
    setGithubLoading(true);
    setGithubError("");

    const paths = [
      "/api/github/repos",
      "/api/github/repositories",
    ];

    let lastError = "The repository endpoint is unavailable.";

    for (const path of paths) {
      const result = await apiRequest<
        GitHubRepository[] | { repositories?: GitHubRepository[] }
      >(path);

      if (result.ok && result.data) {
        const list = Array.isArray(result.data)
          ? result.data
          : result.data.repositories || [];

        setRepositories(list);
        setGithubLoading(false);
        return;
      }

      lastError = result.error || lastError;

      // Try the alternative endpoint if the first one does not exist.
      if (result.status !== 404) break;
    }

    setRepositories([]);
    setGithubError(lastError);
    setGithubLoading(false);
  }, []);

  const loadGitHubWorkspace = useCallback(async () => {
    await checkGitHub();
    await loadRepositories();
  }, [checkGitHub, loadRepositories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkBackend();
      void checkGitHub();
      void checkGoogle();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkBackend, checkGitHub, checkGoogle]);

  /* Refresh GitHub when opening its workspace. */

  useEffect(() => {
    if (activePage === "github") {
      const timer = window.setTimeout(() => void loadGitHubWorkspace(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [activePage, loadGitHubWorkspace]);

  /* =======================================================
     Conversation actions
     ======================================================= */

  const createNewChat = useCallback(() => {
    const conversation = createConversation();

    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setChatInput("");
    setChatError("");
    navigate("assistant");

    window.setTimeout(() => chatInputRef.current?.focus(), 80);
  }, [navigate]);

  const deleteConversation = useCallback(
    (id: string) => {
      const remaining = conversations.filter(
        (conversation) => conversation.id !== id
      );

      if (remaining.length === 0) {
        const fresh = createConversation();
        setConversations([fresh]);
        setActiveConversationId(fresh.id);
      } else {
        setConversations(remaining);

        if (activeConversationId === id) {
          setActiveConversationId(remaining[0].id);
        }
      }

      showToast("Conversation deleted");
    },
    [conversations, activeConversationId, showToast]
  );

  /* =======================================================
     AI chat

     Backend request format:
       POST /api/chat
       { "message": "..." }

     The client also accepts common response shapes:
       { "response": "..." }
       { "reply": "..." }
       { "answer": "..." }
       { "message": "..." }

     If your backend uses another format, update this function
     to match the actual FastAPI endpoint.
     ======================================================= */

  const sendChat = useCallback(
    async (textOverride?: string) => {
      const messageText = (textOverride ?? chatInput).trim();

      if (!messageText || chatLoading) return;

      let conversation = activeConversation;

      if (!conversation) {
        conversation = createConversation();
        setConversations((current) => [conversation!, ...current]);
        setActiveConversationId(conversation.id);
      }

      const conversationId = conversation.id;
      const userMessage = createMessage("user", messageText);

      updateConversation(conversationId, (current) => ({
        ...current,
        title:
          current.messages.length === 0
            ? messageText.slice(0, 48)
            : current.title,
        messages: [...current.messages, userMessage],
        updatedAt: new Date().toISOString(),
      }));

      setChatInput("");
      setChatError("");
      setChatLoading(true);
      navigate(activePage === "code" ? "code" : "assistant");

      try {
        const result = await apiRequest<Record<string, unknown>>("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            message: messageText,
            // FastAPI accepts only its defined assistant modes. Keep this
            // request deliberately small so schema validation remains stable.
            mode: activePage === "code" ? "debug" : "chat",
          }),
        });

        if (!result.ok) {
          throw new Error(
            result.error ||
              "The AI endpoint returned an error. Check your backend."
          );
        }

        const data = result.data || {};

        const answer =
          (typeof data.response === "string" && data.response) ||
          (typeof data.reply === "string" && data.reply) ||
          (typeof data.answer === "string" && data.answer) ||
          (typeof data.output === "string" && data.output) ||
          (typeof data.message === "string" && data.message) ||
          (typeof data.content === "string" && data.content) ||
          "";

        if (!answer) {
          throw new Error(
            "The backend responded, but no text answer was found. Update the response parser to match your API."
          );
        }

        const assistantMessage = createMessage("assistant", answer);

        updateConversation(conversationId, (current) => ({
          ...current,
          messages: [...current.messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        }));
      } catch (error) {
        const message = getErrorMessage(error);

        setChatError(message);

        updateConversation(conversationId, (current) => ({
          ...current,
          messages: [
            ...current.messages,
            createMessage(
              "assistant",
              `I couldn't complete that request.\n\n**Error:** ${message}\n\nCheck that the FastAPI backend is running at ${API_BASE_URL} and that its \`/api/chat\` endpoint is available.`
            ),
          ],
          updatedAt: new Date().toISOString(),
        }));
      } finally {
        setChatLoading(false);
      }
    },
    [
      activeConversation,
      activePage,
      chatInput,
      chatLoading,
      navigate,
      updateConversation,
    ]
  );

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendChat();
  };

  const handleChatKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendChat();
    }
  };

  /* =======================================================
     Integration actions
     ======================================================= */

  const connectIntegration = useCallback(
    async (integration: Integration) => {
      // Open immediately while this click is still a trusted browser gesture.
      // Delaying this until after fetch() causes popup blockers to discard it.
      if (integration.websiteUrl) {
        const serviceTab = window.open(integration.websiteUrl, "_blank");
        if (serviceTab) {
          serviceTab.opener = null;
          showToast(`Opened ${integration.name} in a new tab`);
          return;
        }
        showToast("Your browser blocked the new tab. Allow popups for DevPilotAI and try again.");
        return;
      }

      if (integration.id === "github") {
        navigate("github");

        if (githubStatus?.connected) {
          showToast("GitHub is already connected");
          return;
        }
      }

      if (integration.id === "supabase") {
        showToast(
          "Supabase requires project credentials and a backend status check."
        );
        navigate("settings");
        return;
      }

      if (!integration.connectPath) {
        if (integration.websiteUrl) {
          window.open(integration.websiteUrl, "_blank", "noopener,noreferrer");
          return;
        }
        showToast(
          `${integration.name} needs its OAuth flow configured in the backend.`
        );
        return;
      }

      // Do not redirect to guessed or nonexistent routes.
      // Check whether the configured backend route exists first.
      const result = await apiRequest<{ authorization_url?: string }>(
        integration.connectPath
      );

      if (result.status === 404) {
        if (integration.websiteUrl) {
          window.open(integration.websiteUrl, "_blank", "noopener,noreferrer");
          return;
        }
        showToast(
          `${integration.name} OAuth route is not implemented in the backend yet.`
        );
        return;
      }

      if (!result.ok) {
        if (result.status === 503 && integration.websiteUrl) {
          window.open(integration.websiteUrl, "_blank", "noopener,noreferrer");
          return;
        }
        showToast(
          result.error ||
            `Could not start ${integration.name} authentication.`
        );
        return;
      }

      const data = result.data;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }

      // Some OAuth routes return a redirect directly. Fetch follows
      // redirects, so use a normal browser navigation for the login flow
      // when the route exists but doesn't return a JSON authorization URL.
      window.location.href = `${API_BASE_URL}${integration.connectPath}`;
    },
    [githubStatus, navigate, showToast]
  );

  /* =======================================================
     Settings
     ======================================================= */

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("displayName") || "").trim();

    if (nextName) {
      setDisplayName(nextName);
    }

    setSettingsSaved(true);
    showToast("Workspace preferences saved");
    window.setTimeout(() => setSettingsSaved(false), 2500);
  };

  /* =======================================================
     Header / sidebar
     ======================================================= */

  const pageTitle = getPageTitle(activePage);

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSidebar = () => (
    <aside
      className={`dp-sidebar ${sidebarCollapsed ? "is-collapsed" : ""} ${
        mobileSidebarOpen ? "is-mobile-open" : ""
      }`}
    >
      <div className="dp-brand">
        <div className="dp-brand-mark">
          <span>✳</span>
        </div>

        {!sidebarCollapsed && (
          <div className="dp-brand-copy">
            <span className="dp-brand-name">DevPilot<span>AI</span></span>
            <span className="dp-brand-caption">YOUR AI WORKSPACE</span>
          </div>
        )}

        <button
          className="dp-icon-button dp-sidebar-close"
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      <button
        className="dp-new-chat"
        type="button"
        onClick={createNewChat}
        title="New conversation"
      >
        <span>＋</span>
        {!sidebarCollapsed && <span>New conversation</span>}
        {!sidebarCollapsed && <kbd>⌘ K</kbd>}
      </button>

      <div className="dp-navigation">
        {NAVIGATION.map((group) => (
          <div className="dp-nav-group" key={group.heading}>
            {!sidebarCollapsed && (
              <div className="dp-nav-heading">{group.heading}</div>
            )}

            {group.items.map((item) => (
              <button
                className={`dp-nav-item ${
                  activePage === item.id ? "is-active" : ""
                }`}
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.serviceId) {
                    const integration = integrations.find(
                      (candidate) => candidate.id === item.serviceId
                    );
                    if (integration) void connectIntegration(integration);
                    return;
                  }
                  navigate(item.id);
                }}
                title={item.label}
              >
                <Icon>{item.icon}</Icon>

                {!sidebarCollapsed && <span>{item.label}</span>}

                {!sidebarCollapsed && item.badge && (
                  <span className="dp-nav-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        {!sidebarCollapsed && (
          <div className="dp-history">
            <div className="dp-nav-heading">RECENT CONVERSATIONS</div>

            {filteredConversations.slice(0, 6).map((conversation) => (
              <div
                className={`dp-history-item ${
                  activeConversationId === conversation.id
                    ? "is-active"
                    : ""
                }`}
                key={conversation.id}
              >
                <button
                  type="button"
                  className="dp-history-title"
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    navigate("assistant");
                  }}
                  title={conversation.title}
                >
                  <span>◦</span>
                  <span>{conversation.title}</span>
                </button>

                <button
                  type="button"
                  className="dp-history-delete"
                  title="Delete conversation"
                  aria-label={`Delete ${conversation.title}`}
                  onClick={() => deleteConversation(conversation.id)}
                >
                  ×
                </button>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <p className="dp-history-empty">No conversations found.</p>
            )}
          </div>
        )}
      </div>

      <div className="dp-sidebar-bottom">
        <div className="dp-backend-status">
          <StatusDot status={backendStatus} />

          {!sidebarCollapsed && (
            <div>
              <span className="dp-backend-label">
                {backendStatus === "online"
                  ? "Backend online"
                  : backendStatus === "checking"
                    ? "Checking backend"
                    : "Backend offline"}
              </span>

              <span className="dp-backend-url">FastAPI · :8082</span>
            </div>
          )}
        </div>

        <button
          className="dp-profile"
          type="button"
          onClick={() => navigate("settings")}
        >
          <span className="dp-avatar">
            {displayName.charAt(0).toUpperCase() || "D"}
          </span>

          {!sidebarCollapsed && (
            <>
              <span className="dp-profile-info">
                <strong>{displayName}</strong>
                <small>{authUser?.email || "Workspace account"}</small>
              </span>
              <span className="dp-profile-menu">···</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="dp-topbar">
      <div className="dp-topbar-left">
        <button
          className="dp-icon-button dp-menu-toggle"
          type="button"
          onClick={() => setMobileSidebarOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <button
          className="dp-icon-button dp-collapse-toggle"
          type="button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label="Collapse sidebar"
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>

        <div className="dp-breadcrumb">
          <span>Workspace</span>
          <span className="dp-breadcrumb-separator">/</span>
          <strong>{pageTitle}</strong>
        </div>
      </div>

      <div className="dp-topbar-right">
        <div className="dp-live-indicator">
          <StatusDot status={backendStatus} />
          <span>
            {backendStatus === "online"
              ? "System operational"
              : backendStatus === "checking"
                ? "Connecting"
                : "Backend offline"}
          </span>
        </div>

        <button
          className="dp-icon-button dp-help-button"
          type="button"
          title="Check backend connection"
          onClick={() => void checkBackend()}
        >
          ↻
        </button>

        <button
          className="dp-topbar-avatar"
          type="button"
          title="Workspace settings"
          onClick={() => navigate("settings")}
        >
          {displayName.charAt(0).toUpperCase() || "D"}
        </button>
      </div>
    </header>
  );

  /* =======================================================
     Overview page
     ======================================================= */

  const renderOverview = () => (
    <div className="dp-page">
      <section className="dp-welcome">
        <div>
          <div className="dp-eyebrow">
            <span className="dp-eyebrow-line" />
            YOUR DEVELOPMENT WORKSPACE
          </div>

          <h1>
            Build something
            <br />
            <span>extraordinary.</span>
          </h1>

          <p>
            Your AI-powered workspace for thinking, coding, and connecting
            your tools. What are we building today?
          </p>

          <div className="dp-welcome-actions">
            <Button variant="primary" onClick={() => navigate("assistant")}>
              <span>✳</span> Open AI Assistant <span>→</span>
            </Button>

            <Button onClick={() => navigate("integrations")}>
              Explore integrations
            </Button>
          </div>
        </div>

        <div className="dp-orbit-art" aria-hidden="true">
          <div className="dp-orbit dp-orbit-one" />
          <div className="dp-orbit dp-orbit-two" />
          <div className="dp-orbit dp-orbit-three" />
          <div className="dp-orbit-core">✳</div>
          <span className="dp-orbit-node dp-node-one">AI</span>
          <span className="dp-orbit-node dp-node-two">&lt;/&gt;</span>
          <span className="dp-orbit-node dp-node-three">⌘</span>
        </div>
      </section>

      <section className="dp-section">
        <div className="dp-section-heading">
          <div>
            <h2>Workspace overview</h2>
            <p>Your tools, all in one place.</p>
          </div>

          <button
            className="dp-text-button"
            type="button"
            onClick={() => navigate("settings")}
          >
            Workspace settings →
          </button>
        </div>

        <div className="dp-stats-grid">
          <div className="dp-stat-card">
            <div className="dp-stat-top">
              <span>Conversations</span>
              <span className="dp-stat-icon">✳</span>
            </div>
            <strong>{conversations.length}</strong>
            <small>Saved in this browser</small>
          </div>

          <div className="dp-stat-card">
            <div className="dp-stat-top">
              <span>Integrations</span>
              <span className="dp-stat-icon">⧉</span>
            </div>
            <strong>{integrations.length}</strong>
            <small>Available service cards</small>
          </div>

          <div className="dp-stat-card">
            <div className="dp-stat-top">
              <span>Connected services</span>
              <span className="dp-stat-icon">↗</span>
            </div>
            <strong>{connectedCount}</strong>
            <small>Verified by current status</small>
          </div>

          <div className="dp-stat-card">
            <div className="dp-stat-top">
              <span>Backend</span>
              <span className="dp-stat-icon">⌁</span>
            </div>
            <strong className="dp-stat-status">
              {backendStatus === "online"
                ? "Online"
                : backendStatus === "checking"
                  ? "Checking"
                  : "Offline"}
            </strong>
            <small>FastAPI connection</small>
          </div>
        </div>
      </section>

      <section className="dp-section">
        <div className="dp-section-heading">
          <div>
            <h2>Jump back in</h2>
            <p>Choose a workspace to continue.</p>
          </div>
        </div>

        <div className="dp-feature-grid">
          <button
            className="dp-feature-card dp-feature-ai"
            type="button"
            onClick={() => navigate("assistant")}
          >
            <div className="dp-feature-card-top">
              <span className="dp-feature-icon">✳</span>
              <span className="dp-feature-arrow">↗</span>
            </div>
            <h3>AI Assistant</h3>
            <p>Think through ideas, learn concepts, and solve problems.</p>
            <span className="dp-feature-link">Start a conversation →</span>
          </button>

          <button
            className="dp-feature-card"
            type="button"
            onClick={() => navigate("code")}
          >
            <div className="dp-feature-card-top">
              <span className="dp-feature-icon">&lt;/&gt;</span>
              <span className="dp-feature-arrow">↗</span>
            </div>
            <h3>Code Assistant</h3>
            <p>Debug errors, review code, and plan implementations.</p>
            <span className="dp-feature-link">Open code workspace →</span>
          </button>

          <button
            className="dp-feature-card"
            type="button"
            onClick={() => navigate("github")}
          >
            <div className="dp-feature-card-top">
              <span className="dp-feature-icon">⌘</span>
              <span className="dp-feature-arrow">↗</span>
            </div>
            <h3>GitHub workspace</h3>
            <p>Check your connection and browse available repositories.</p>
            <span className="dp-feature-link">Explore repositories →</span>
          </button>
        </div>
      </section>

      <section className="dp-section">
        <div className="dp-section-heading">
          <div>
            <h2>Connected ecosystem</h2>
            <p>Service status reported by the current workspace.</p>
          </div>

          <button
            className="dp-text-button"
            type="button"
            onClick={() => navigate("integrations")}
          >
            Manage all →
          </button>
        </div>

        <div className="dp-mini-integrations">
          {integrations.slice(0, 5).map((integration) => (
            <button
              className="dp-mini-integration"
              key={integration.id}
              type="button"
              onClick={() => navigate("integrations")}
            >
              <span
                className="dp-integration-icon"
                style={{ "--integration-color": integration.color } as React.CSSProperties}
              >
                {integration.icon}
              </span>

              <span className="dp-mini-integration-copy">
                <strong>{integration.name}</strong>
                <small>{integration.detail || "Not connected"}</small>
              </span>

              <StatusDot status={integration.status} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  /* =======================================================
     AI Assistant / Code Assistant
     ======================================================= */

  const renderAssistant = (codeMode = false) => {
    const hasMessages = currentMessages.length > 0;

    return (
      <div className={`dp-chat-page ${hasMessages ? "has-messages" : ""}`}>
        {!hasMessages ? (
          <div className="dp-chat-welcome">
            <div className="dp-chat-symbol">
              {codeMode ? "</>" : "✳"}
            </div>

            <div className="dp-eyebrow">
              {codeMode ? "YOUR CODING COPILOT" : "YOUR AI WORKSPACE"}
            </div>

            <h1>
              {codeMode ? (
                <>
                  Let's build
                  <br />
                  <span>something great.</span>
                </>
              ) : (
                <>
                  What can I help
                  <br />
                  <span>you with today?</span>
                </>
              )}
            </h1>

            <p>
              {codeMode
                ? "Ask about code, debug errors, plan features, or understand an unfamiliar codebase."
                : "Ask questions, explore ideas, solve problems, or work through your next big project."}
            </p>

            <div className="dp-prompt-grid">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  className="dp-prompt-card"
                  key={prompt.title}
                  type="button"
                  onClick={() => {
                    setChatInput(prompt.prompt);
                    window.setTimeout(
                      () => chatInputRef.current?.focus(),
                      50
                    );
                  }}
                >
                  <span className="dp-prompt-icon">{prompt.icon}</span>
                  <span className="dp-prompt-copy">
                    <strong>{prompt.title}</strong>
                    <small>{prompt.description}</small>
                  </span>
                  <span className="dp-prompt-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="dp-chat-transcript">
            {currentMessages.map((message) => (
              <article
                className={`dp-message dp-message-${message.role}`}
                key={message.id}
              >
                <div className="dp-message-avatar">
                  {message.role === "user"
                    ? displayName.charAt(0).toUpperCase()
                    : "✳"}
                </div>

                <div className="dp-message-body">
                  <div className="dp-message-meta">
                    <strong>
                      {message.role === "user" ? displayName : "DevPilot AI"}
                    </strong>
                    <span>{formatRelativeDate(message.createdAt)}</span>
                  </div>

                  <MessageContent content={message.content} />
                </div>
              </article>
            ))}

            {chatLoading && (
              <article className="dp-message dp-message-assistant">
                <div className="dp-message-avatar">✳</div>
                <div className="dp-message-body">
                  <div className="dp-message-meta">
                    <strong>DevPilot AI</strong>
                    <span>Thinking</span>
                  </div>
                  <div className="dp-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {chatError && (
          <div className="dp-chat-error" role="status">
            <span>!</span>
            <p>{chatError}</p>
            <button type="button" onClick={() => setChatError("")}>
              ×
            </button>
          </div>
        )}

        <div className="dp-chat-composer-wrap">
          <form className="dp-chat-composer" onSubmit={handleChatSubmit}>
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder={
                codeMode
                  ? "Ask about code, debugging, architecture..."
                  : "Message DevPilot AI..."
              }
              rows={2}
              disabled={chatLoading}
            />

            <div className="dp-composer-bottom">
              <div className="dp-composer-tools">
                <span className="dp-composer-mode">
                  {codeMode ? "</> Code mode" : "✳ AI mode"}
                </span>
                <span className="dp-composer-hint">
                  Enter to send · Shift + Enter for a new line
                </span>
              </div>

              <button
                className="dp-send-button"
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                aria-label="Send message"
              >
                {chatLoading ? "…" : "↑"}
              </button>
            </div>
          </form>

          <div className="dp-composer-disclaimer">
            AI responses can be inaccurate. Review important code before use.
          </div>
        </div>
      </div>
    );
  };

  /* =======================================================
     GitHub workspace
     ======================================================= */

  const renderGitHub = () => {
    const isConnected = Boolean(githubStatus?.connected);

    return (
      <div className="dp-page">
        <section className="dp-page-intro">
          <div>
            <div className="dp-eyebrow">DEVELOPMENT WORKSPACE</div>
            <h1>GitHub workspace<span>.</span></h1>
            <p>
              Bring your repositories into your development workflow.
            </p>
          </div>

          <div className="dp-page-actions">
            <Button onClick={() => void loadGitHubWorkspace()}>
              ↻ Refresh
            </Button>

            <Button
              variant="primary"
              onClick={() =>
                void connectIntegration(
                  integrations.find((item) => item.id === "github")!
                )
              }
            >
              {isConnected ? "Connected" : "Connect GitHub"}
            </Button>
          </div>
        </section>

        <section className="dp-github-profile-card">
          <div className="dp-github-profile-main">
            {githubUser?.avatar_url ? (
              <img
                className="dp-github-avatar"
                src={githubUser.avatar_url}
                alt={`${githubUser.login || "GitHub"} avatar`}
              />
            ) : (
              <div className="dp-github-avatar dp-github-avatar-placeholder">
                ⌘
              </div>
            )}

            <div>
              <div className="dp-profile-name-row">
                <h2>
                  {githubUser?.name ||
                    githubUser?.login ||
                    (isConnected ? "GitHub account" : "GitHub not connected")}
                </h2>
                <span
                  className={`dp-pill ${
                    isConnected ? "dp-pill-success" : "dp-pill-muted"
                  }`}
                >
                  <StatusDot
                    status={isConnected ? "connected" : "disconnected"}
                  />
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              <p>
                {githubUser?.login
                  ? `@${githubUser.login}`
                  : "Connect your GitHub account to load your profile and repositories."}
              </p>

              {githubUser?.bio && (
                <p className="dp-github-bio">{githubUser.bio}</p>
              )}
            </div>
          </div>

          <div className="dp-github-profile-stats">
            <div>
              <strong>{repositories.length}</strong>
              <small>Loaded repos</small>
            </div>
            <div>
              <strong>{githubUser?.public_repos ?? "—"}</strong>
              <small>Public repos</small>
            </div>
            <div>
              <strong>{githubUser?.followers ?? "—"}</strong>
              <small>Followers</small>
            </div>
          </div>
        </section>

        {githubError && (
          <div className="dp-inline-notice">
            <span>!</span>
            <div>
              <strong>Could not load repositories</strong>
              <p>{githubError}</p>
              <small>
                Check that the backend implements
                {" /api/github/repos "}
                or
                {" /api/github/repositories "}
                and returns a repository array.
              </small>
            </div>
          </div>
        )}

        <section className="dp-section">
          <div className="dp-section-heading dp-repository-heading">
            <div>
              <h2>Your repositories</h2>
              <p>
                {isConnected
                  ? "Repositories returned by your backend."
                  : "Connect GitHub and configure repository access."}
              </p>
            </div>

            <label className="dp-search-box dp-repo-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search repositories..."
                value={repoSearch}
                onChange={(event) => setRepoSearch(event.target.value)}
              />
            </label>
          </div>

          {githubLoading ? (
            <div className="dp-loading-panel">
              <div className="dp-spinner" />
              <span>Loading GitHub workspace...</span>
            </div>
          ) : visibleRepositories.length > 0 ? (
            <div className="dp-repository-grid">
              {visibleRepositories.map((repo) => (
                <article className="dp-repository-card" key={repo.id}>
                  <div className="dp-repository-top">
                    <span className="dp-repository-icon">⌘</span>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="dp-repository-open"
                      aria-label={`Open ${repo.full_name} on GitHub`}
                    >
                      ↗
                    </a>
                  </div>

                  <h3>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {repo.name}
                    </a>
                  </h3>

                  <p className="dp-repository-description">
                    {repo.description || "No description provided."}
                  </p>

                  <div className="dp-repository-meta">
                    {repo.language && (
                      <span className="dp-repository-language">
                        <span className="dp-language-dot" />
                        {repo.language}
                      </span>
                    )}

                    <span>☆ {repo.stargazers_count ?? 0}</span>
                    <span>⑂ {repo.forks_count ?? 0}</span>
                  </div>

                  <div className="dp-repository-footer">
                    <span>
                      {repo.private ? "Private repository" : "Public repository"}
                    </span>
                    <span>{formatRelativeDate(repo.updated_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⌘"
              title={
                isConnected
                  ? "No repositories to display"
                  : "Your code starts here"
              }
              description={
                isConnected
                  ? repoSearch
                    ? "No repositories match your search."
                    : "The backend did not return any repositories. Check its repository endpoint."
                  : "Connect GitHub to load your repositories and build a connected development workspace."
              }
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!isConnected) {
                      const github = integrations.find(
                        (item) => item.id === "github"
                      );

                      if (github) void connectIntegration(github);
                    } else {
                      void loadRepositories();
                    }
                  }}
                >
                  {isConnected ? "Reload repositories" : "Connect GitHub"}
                </Button>
              }
            />
          )}
        </section>

        <section className="dp-section">
          <div className="dp-section-heading">
            <div>
              <h2>Developer tools</h2>
              <p>Continue working with your connected workspace.</p>
            </div>
          </div>

          <div className="dp-feature-grid">
            <button
              className="dp-feature-card"
              type="button"
              onClick={() => navigate("code")}
            >
              <div className="dp-feature-card-top">
                <span className="dp-feature-icon">&lt;/&gt;</span>
                <span className="dp-feature-arrow">↗</span>
              </div>
              <h3>Code Assistant</h3>
              <p>Get help planning, understanding, and debugging code.</p>
              <span className="dp-feature-link">Open Code Assistant →</span>
            </button>

            <button
              className="dp-feature-card"
              type="button"
              onClick={() => navigate("integrations")}
            >
              <div className="dp-feature-card-top">
                <span className="dp-feature-icon">⧉</span>
                <span className="dp-feature-arrow">↗</span>
              </div>
              <h3>More integrations</h3>
              <p>Explore available services for your workflow.</p>
              <span className="dp-feature-link">Manage integrations →</span>
            </button>
          </div>
        </section>
      </div>
    );
  };

  /* =======================================================
     Integrations page
     ======================================================= */

  const renderIntegrations = () => {
    const categories = [
      "All",
      "Connected",
      "Not connected",
      "Identity",
      "Email",
      "Development",
      "Productivity",
      "Social",
      "Database",
    ];

    return (
      <div className="dp-page">
        <section className="dp-page-intro">
          <div>
            <div className="dp-eyebrow">YOUR CONNECTED ECOSYSTEM</div>
            <h1>One workspace<span>.</span></h1>
            <p>
              Manage the services that power your development workflow.
            </p>
          </div>

          <div className="dp-page-actions">
            <Button onClick={() => void checkBackend()}>
              ↻ Check backend
            </Button>
          </div>
        </section>

        <section className="dp-integration-banner">
          <div className="dp-integration-banner-symbol">⧉</div>
          <div className="dp-integration-banner-copy">
            <h2>Everything connected, one workflow.</h2>
            <p>
              Connect the tools you use every day. Services become active
              when their authentication and backend configuration are ready.
            </p>
          </div>

          <div className="dp-integration-banner-count">
            <strong>{connectedCount}/{integrations.length}</strong>
            <span>Connected</span>
          </div>
        </section>

        <div className="dp-integration-toolbar">
          <div className="dp-filter-pills">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={`dp-filter-pill ${
                  integrationFilter === category ? "is-active" : ""
                }`}
                onClick={() => setIntegrationFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-integration-grid">
          {visibleIntegrations.map((integration) => (
            <article className="dp-integration-card" key={integration.id}>
              <div className="dp-integration-card-top">
                <span
                  className="dp-integration-icon"
                  style={
                    {
                      "--integration-color": integration.color,
                    } as React.CSSProperties
                  }
                >
                  {integration.icon}
                </span>

                <span className="dp-integration-category">
                  {integration.category}
                </span>
              </div>

              <h3>{integration.name}</h3>
              <p>{integration.description}</p>

              <div className="dp-integration-status">
                <StatusDot status={integration.status} />
                <span>{integration.detail || "Not connected"}</span>
              </div>

              <div className="dp-integration-card-footer">
                <button
                  className="dp-integration-info"
                  type="button"
                  title={integration.setupHint}
                  onClick={() => showToast(integration.setupHint)}
                >
                  Setup info ⓘ
                </button>

                <Button
                  variant={
                    integration.status === "connected"
                      ? "secondary"
                      : "primary"
                  }
                  onClick={() => {
                    if (integration.id === "github") {
                      navigate("github");
                      void loadGitHubWorkspace();
                      return;
                    }

                    void connectIntegration(integration);
                  }}
                  disabled={integration.status === "checking"}
                >
                  {integration.status === "connected"
                    ? "Manage"
                    : integration.status === "checking"
                      ? "Checking..."
                      : "Connect"}
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="dp-integration-note">
          <span>ⓘ</span>
          <p>
            <strong>Security note:</strong> Never place OAuth client secrets,
            private API keys, or database service-role keys in frontend code.
            Keep secret credentials in your backend environment variables.
          </p>
        </div>
      </div>
    );
  };

  /* =======================================================
     Settings page
     ======================================================= */

  const renderSettings = () => (
    <div className="dp-page">
      <section className="dp-page-intro">
        <div>
          <div className="dp-eyebrow">PERSONALIZE YOUR WORKSPACE</div>
          <h1>Settings<span>.</span></h1>
          <p>Configure your workspace and inspect the backend connection.</p>
        </div>
      </section>

      <div className="dp-settings-layout">
        <aside className="dp-settings-nav">
          <button className="is-active" type="button">
            <span>◉</span> General
          </button>
          <button
            type="button"
            onClick={() => navigate("integrations")}
          >
            <span>⧉</span> Integrations
          </button>
          <button type="button" onClick={() => void checkBackend()}>
            <span>⌁</span> Connection
          </button>
        </aside>

        <div className="dp-settings-content">
          <form className="dp-settings-card" onSubmit={saveSettings}>
            <div className="dp-settings-card-heading">
              <div>
                <h2>General preferences</h2>
                <p>Set up how DevPilotAI appears in your workspace.</p>
              </div>
            </div>

            <label className="dp-form-field">
              <span>Display name</span>
              <input
                name="displayName"
                defaultValue={displayName}
                maxLength={60}
                placeholder="Your name"
              />
              <small>This name appears in the sidebar and chat.</small>
            </label>

            <div className="dp-settings-card-footer">
              <span>
                {settingsSaved ? "✓ Preferences saved" : "Saved locally"}
              </span>
              <Button variant="primary" type="submit">
                Save changes
              </Button>
            </div>
          </form>

          <div className="dp-settings-card">
            <div className="dp-settings-card-heading">
              <div>
                <h2>Backend connection</h2>
                <p>Current API server and connectivity status.</p>
              </div>

              <span
                className={`dp-pill ${
                  backendStatus === "online"
                    ? "dp-pill-success"
                    : "dp-pill-muted"
                }`}
              >
                <StatusDot status={backendStatus} />
                {backendStatus === "online"
                  ? "Online"
                  : backendStatus === "checking"
                    ? "Checking"
                    : "Offline"}
              </span>
            </div>

            <div className="dp-connection-detail">
              <span>API base URL</span>
              <code>{API_BASE_URL}</code>
            </div>

            <div className="dp-connection-detail">
              <span>Health endpoint</span>
              <code>/health</code>
            </div>

            <div className="dp-settings-card-footer">
              <span>Configured through VITE_API_URL</span>
              <Button onClick={() => void checkBackend()}>
                Test connection ↻
              </Button>
            </div>
          </div>

          <div className="dp-settings-card">
            <div className="dp-settings-card-heading">
              <div>
                <h2>GitHub connection</h2>
                <p>Review the current GitHub authentication status.</p>
              </div>

              <span
                className={`dp-pill ${
                  githubStatus?.connected
                    ? "dp-pill-success"
                    : "dp-pill-muted"
                }`}
              >
                <StatusDot
                  status={
                    githubStatus?.connected ? "connected" : "disconnected"
                  }
                />
                {githubStatus?.connected ? "Connected" : "Not connected"}
              </span>
            </div>

            <div className="dp-connection-detail">
              <span>Account</span>
              <code>
                {githubUser?.login || githubUser?.name || "Not available"}
              </code>
            </div>

            <div className="dp-connection-detail">
              <span>Granted scopes</span>
              <code>{githubStatus?.scope || "Not available"}</code>
            </div>

            <div className="dp-settings-card-footer">
              <span>Managed through the FastAPI backend</span>
              <Button onClick={() => navigate("github")}>
                Open GitHub →
              </Button>
            </div>
          </div>

          <div className="dp-settings-card dp-settings-danger">
            <div className="dp-settings-card-heading">
              <div>
                <h2>Account</h2>
                <p>{authUser?.email || "Signed in with Supabase email authentication."}</p>
              </div>
            </div>
            <div className="dp-settings-card-footer">
              <span>Your session stays active when you reload this website.</span>
              <Button variant="danger" onClick={() => void logout()} disabled={authBusy}>
                {authBusy ? "Signing out…" : "Log out"}
              </Button>
            </div>
          </div>

          <div className="dp-settings-card dp-settings-danger">
            <div className="dp-settings-card-heading">
              <div>
                <h2>Local conversation data</h2>
                <p>
                  Conversations are currently stored in this browser's
                  local storage.
                </p>
              </div>
            </div>

            <div className="dp-settings-card-footer">
              <span>{conversations.length} saved conversations</span>
              <Button
                variant="danger"
                onClick={() => {
                  const fresh = createConversation();
                  setConversations([fresh]);
                  setActiveConversationId(fresh.id);
                  showToast("Local conversation history cleared");
                }}
              >
                Clear local history
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* =======================================================
     Page routing
     ======================================================= */

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return renderOverview();

      case "assistant":
        return renderAssistant(false);

      case "code":
        return renderAssistant(true);

      case "github":
        return renderGitHub();

      case "integrations":
        return renderIntegrations();

      case "settings":
        return renderSettings();

      default:
        return renderOverview();
    }
  };

  /* =======================================================
     Render
     ======================================================= */

  if (!authReady) return <main className="dp-auth-page"><p>Loading workspace…</p></main>;

  if (!signedIn) return (
    <main className="dp-auth-page">
      <section className="dp-auth-intro"><div className="dp-brand-mark"><span>✳</span></div><div className="dp-eyebrow">DEVPILOTAI · YOUR AI WORKSPACE</div><h1>Welcome<span>.</span></h1><p>Use a verified Supabase email to enter your workspace.</p></section>
      <form className="dp-auth-card" onSubmit={(event) => void submitAuth(event, authMode)}>
        <h2>{authMode === "login" ? "Sign in to DevPilotAI" : "Create your DevPilotAI account"}</h2>
        <p>{authMode === "login" ? "Use your verified email and password to continue." : "We’ll send a verification link to your email address."}</p>
        {authMode === "signup" && <label className="dp-form-field"><span>Display name</span><input name="displayName" type="text" required maxLength={60} autoComplete="name" /></label>}
        <label className="dp-form-field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
        <label className="dp-form-field"><span>Password</span><input name="password" type="password" required minLength={8} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
        {authError && <p className="dp-chat-error">{authError}</p>}
        {authMessage && <p className="dp-auth-message">{authMessage}</p>}
        <div className="dp-auth-actions"><Button variant="primary" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Sign in" : "Send verification email"}</Button><button type="button" className="dp-integration-info" onClick={() => { setAuthMode((mode) => mode === "login" ? "signup" : "login"); setAuthError(""); setAuthMessage(""); }}>{authMode === "login" ? "Create account" : "I already have an account"}</button></div>
      </form>
    </main>
  );

  return (
    <div className="dp-app">
      {mobileSidebarOpen && (
        <button
          className="dp-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {renderSidebar()}

      <main
        className={`dp-main ${
          sidebarCollapsed ? "dp-main-expanded" : ""
        }`}
      >
        {renderHeader()}

        <div className={`dp-content dp-content-${activePage}`}>
          {renderPage()}
        </div>
      </main>

      {toast && (
        <div className="dp-toast" role="status">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
