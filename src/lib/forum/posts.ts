// Forum posts model. Replaces the old /browse cohort directory with
// a Hacker News / Reddit-shape post feed. Cohort directory was killed
// per founder direction: passive browsing of strangers contradicts
// the curated-Drop thesis. Active posting (Show / Ask / Feedback /
// Hiring) keeps the feed valuable without diluting Drops.
//
// Storage: localStorage at "jumpstart.posts" as a JSON array. Per-user
// vote state lives at "jumpstart.posts.votes" so users can't double-
// upvote and votes survive reloads. Single source of truth; all
// reads/writes go through this module.
//
// Closed-beta-of-10 posture: browser-local storage. Promotes to a
// Supabase posts table at v1.5+ with the same schema shape.

export type PostCategory = "show" | "ask" | "feedback" | "hiring" | "other";

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  show: "Show",
  ask: "Ask",
  feedback: "Feedback",
  hiring: "Hiring",
  other: "Other",
};

export type Comment = {
  id: string;
  author_user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type Post = {
  id: string;
  author_user_id: string;
  author_name: string;
  category: PostCategory;
  title: string;
  body: string;
  created_at: string;
  upvotes: number;
  comments: Comment[];
};

const POSTS_KEY = "jumpstart.posts";
const VOTES_KEY = "jumpstart.posts.votes";
const SEED_FLAG = "jumpstart.posts.seeded";

export function loadPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Post[];
  } catch {
    return [];
  }
}

export function savePosts(posts: Post[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {
    // quota or privacy mode - non-fatal
  }
}

export function findPost(id: string): Post | undefined {
  return loadPosts().find((p) => p.id === id);
}

export function loadVotes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(VOTES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed as string[]);
  } catch {
    return new Set();
  }
}

export function saveVotes(votes: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(Array.from(votes)));
  } catch {
    // non-fatal
  }
}

export function createPost(args: {
  author_user_id: string;
  author_name: string;
  category: PostCategory;
  title: string;
  body: string;
}): Post {
  const now = new Date().toISOString();
  const post: Post = {
    id: `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    author_user_id: args.author_user_id,
    author_name: args.author_name,
    category: args.category,
    title: args.title.trim(),
    body: args.body.trim(),
    created_at: now,
    upvotes: 1, // self-upvote on create, classic HN
    comments: [],
  };
  const all = loadPosts();
  all.unshift(post);
  savePosts(all);
  // Self-upvote tracked in votes set so the author can't toggle it
  // back into a 0-upvote post.
  const votes = loadVotes();
  votes.add(post.id);
  saveVotes(votes);
  return post;
}

export function toggleUpvote(postId: string): { upvotes: number; voted: boolean } | undefined {
  const all = loadPosts();
  const i = all.findIndex((p) => p.id === postId);
  if (i < 0) return undefined;
  const votes = loadVotes();
  const had = votes.has(postId);
  if (had) {
    votes.delete(postId);
    all[i].upvotes = Math.max(0, all[i].upvotes - 1);
  } else {
    votes.add(postId);
    all[i].upvotes += 1;
  }
  saveVotes(votes);
  savePosts(all);
  return { upvotes: all[i].upvotes, voted: !had };
}

export function appendComment(
  postId: string,
  comment: Omit<Comment, "id" | "created_at">
): Post | undefined {
  const all = loadPosts();
  const i = all.findIndex((p) => p.id === postId);
  if (i < 0) return undefined;
  const full: Comment = {
    id: `cmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
    ...comment,
  };
  all[i].comments.push(full);
  savePosts(all);
  return all[i];
}

// Demo seed: drop 4 posts on first /browse visit so the feed isn't an
// empty page on day-zero. Idempotent via SEED_FLAG. Removed once real
// users post enough to populate the feed organically.
export function seedDemoPostsIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG) === "1") return;
  const now = Date.now();
  const seeds: Post[] = [
    {
      id: `post_seed_show_${(now - 1000 * 60 * 30).toString(36)}`,
      author_user_id: "u_marcus",
      author_name: "Marcus Chen",
      category: "show",
      title: "Show: open-source observability for AI agent runtimes",
      body: "Built a tracer that captures every LLM call, tool invocation, and state transition across Claude / GPT / Gemini agents. OTEL-compatible, replays every step. MIT licensed. Looking for pilot users running real production agents to break it. https://github.com/marcus-chen-harness/agent-trace",
      created_at: new Date(now - 1000 * 60 * 30).toISOString(),
      upvotes: 14,
      comments: [
        {
          id: "cmt_seed_1",
          author_user_id: "u_priya",
          author_name: "Priya Reddy",
          body: "Does this work with the Anthropic batch API? We're seeing weird timing artifacts there.",
          created_at: new Date(now - 1000 * 60 * 22).toISOString(),
        },
        {
          id: "cmt_seed_2",
          author_user_id: "u_marcus",
          author_name: "Marcus Chen",
          body: "Yes - batch endpoints are first-class. The tracer hooks the queue boundary so you see batch-vs-realtime cleanly.",
          created_at: new Date(now - 1000 * 60 * 18).toISOString(),
        },
      ],
    },
    {
      id: `post_seed_ask_${(now - 1000 * 60 * 60 * 2).toString(36)}`,
      author_user_id: "u_priya",
      author_name: "Priya Reddy",
      category: "ask",
      title: "Ask: Stripe vs Lago for usage-based billing in cross-border payments?",
      body: "We're settling INR↔USD with sub-4-hour latency and want metered billing on top. Stripe Billing handles the table stakes but Lago looks more flexible for our compliance overlays. Anyone shipped real money movement on either? Specifically curious about reconciliation when settlement times diverge from event times.",
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      upvotes: 8,
      comments: [],
    },
    {
      id: `post_seed_feedback_${(now - 1000 * 60 * 60 * 4).toString(36)}`,
      author_user_id: "u_sara",
      author_name: "Sara Lim",
      category: "feedback",
      title: "Feedback: landing page for B2B procurement copilot",
      body: "Pivoted the hero from feature-list to a single big GIF of the demo. Bounce rate dropped 14%, conversion to demo-request stayed flat. Wondering if the next move is sharper ICP filtering on the form, or just more aggressive social proof. Page is at sara-lim-harness.dev. Brutal feedback welcome.",
      created_at: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      upvotes: 5,
      comments: [
        {
          id: "cmt_seed_3",
          author_user_id: "u_aiko",
          author_name: "Aiko Tanaka",
          body: "GIF is sharp but the body copy is fighting it. Two things competing for attention. Try moving copy below the fold and let the demo carry the hero alone.",
          created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        },
      ],
    },
    {
      id: `post_seed_hiring_${(now - 1000 * 60 * 60 * 8).toString(36)}`,
      author_user_id: "u_lena",
      author_name: "Lena Voss",
      category: "hiring",
      title: "Hiring: embedded firmware engineer for battery analytics",
      body: "Looking for one early embedded eng who has shipped CAN bus / ISO 26262 work. Berlin or remote-EU OK, occasional travel to Munich for fleet tests. Equity-heavy, salary on the lower end of competitive. We'll be at SS in person - happy to grab coffee at Chase Center if you're attending.",
      created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      upvotes: 3,
      comments: [],
    },
  ];
  savePosts(seeds);
  // Seed includes 4 posts with varied upvote counts. We do NOT mark
  // these as "voted" by the current user, so they can upvote each.
  window.localStorage.setItem(SEED_FLAG, "1");
}
