"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Button } from "@/components/primitive/Button";
import { Pill } from "@/components/primitive/Pill";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadMe } from "@/lib/mock/me";
import {
  CATEGORY_LABELS,
  createPost,
  loadPosts,
  loadVotes,
  seedDemoPostsIfNeeded,
  toggleUpvote,
  type Post,
  type PostCategory,
} from "@/lib/forum/posts";

const CATEGORIES: { key: PostCategory; label: string; help: string }[] = [
  { key: "show", label: "Show", help: "Something you shipped" },
  { key: "ask", label: "Ask", help: "Question for the cohort" },
  { key: "feedback", label: "Feedback", help: "Roast my X, advice on Y" },
  { key: "hiring", label: "Hiring", help: "Looking for a teammate" },
  { key: "other", label: "Other", help: "Anything else" },
];

export default function BrowsePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [votes, setVotes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PostCategory | "all">("all");
  const [composing, setComposing] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCat, setComposeCat] = useState<PostCategory>("show");
  const [rankingEpoch] = useState(() => Date.now());

  useEffect(() => {
    seedDemoPostsIfNeeded();
    setPosts(loadPosts());
    setVotes(loadVotes());
  }, []);

  const refresh = () => {
    setPosts(loadPosts());
    setVotes(loadVotes());
  };

  const filtered = useMemo(() => {
    const base = filter === "all" ? posts : posts.filter((p) => p.category === filter);
    // Default sort: HN-style score = upvotes / age^1.5. Recency wins.
    return base.slice().sort((a, b) => {
      const ageA = (rankingEpoch - new Date(a.created_at).getTime()) / 3600_000;
      const ageB = (rankingEpoch - new Date(b.created_at).getTime()) / 3600_000;
      const sa = a.upvotes / Math.pow(ageA + 2, 1.4);
      const sb = b.upvotes / Math.pow(ageB + 2, 1.4);
      return sb - sa;
    });
  }, [posts, filter, rankingEpoch]);

  function submitPost() {
    const title = composeTitle.trim();
    const body = composeBody.trim();
    if (title.length < 5 || body.length < 10) return;
    const me = loadMe();
    const result = createPost({
      author_user_id: me.user_id,
      author_name: me.name || "Anonymous",
      category: composeCat,
      title,
      body,
    });
    if (!result.ok) {
      // Hard-blocked content (slurs / threats / doxx). UI never names
      // the specific pattern to avoid feedback for ban-evaders.
      alert("Post blocked. Rewrite without language that targets people or could harm them.");
      return;
    }
    if (result.flagged) {
      // Soft-flagged: post is up, admin will review. Keep the user
      // moving without a scary modal.
      alert("Posted. Heads up: an admin will review the language before it stays public.");
    }
    setComposeTitle("");
    setComposeBody("");
    setComposing(false);
    refresh();
  }

  function vote(id: string) {
    toggleUpvote(id);
    refresh();
  }

  return (
    <>
      <TopBar title="Feed" subtitle="Cohort posts, advice, hiring, show-and-tell" />
      <section className="container-app pt-6 pb-12">
        {/* Compose card. Click "New post" to expand the full form. Keeps
            the feed dense and the composer one tap away. */}
        <div className="surface p-4 mb-5">
          {!composing ? (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="w-full text-left text-sm text-muted py-2 px-3 rounded-md border border-dashed border-border hover:border-ink/40 hover:text-ink transition-colors"
            >
              Post something. Show what you shipped, ask, get feedback, hire…
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <Pill
                    key={c.key}
                    size="sm"
                    active={composeCat === c.key}
                    onClick={() => setComposeCat(c.key)}
                  >
                    {c.label}
                  </Pill>
                ))}
              </div>
              <p className="text-xxs text-muted">
                {CATEGORIES.find((c) => c.key === composeCat)?.help}
              </p>
              <input
                type="text"
                placeholder={`${CATEGORY_LABELS[composeCat]}: title`}
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                maxLength={140}
                className="text-sm px-3 py-2 rounded-md border border-border bg-bg text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink"
              />
              <textarea
                placeholder="Body. Markdown-ish, links, code blocks, whatever. Be useful."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={5}
                maxLength={4000}
                className="text-sm px-3 py-2 rounded-md border border-border bg-bg text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink resize-y leading-relaxed"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xxs text-muted">
                  {composeTitle.length}/140 · {composeBody.length}/4000
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposing(false);
                      setComposeTitle("");
                      setComposeBody("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={submitPost}
                    disabled={composeTitle.trim().length < 5 || composeBody.trim().length < 10}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category filter row */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.key}
              active={filter === c.key}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="surface p-6 text-center">
            <p className="text-sm text-ink mb-1">Nothing here yet.</p>
            <p className="text-xs text-muted">
              Be the first to post. {filter === "all" ? "Anything goes." : `Try a different category.`}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((p) => (
              <PostRow key={p.id} post={p} voted={votes.has(p.id)} onVote={() => vote(p.id)} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
        active
          ? "bg-ink text-bg border-ink"
          : "bg-bg text-muted border-border hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function PostRow({
  post,
  voted,
  onVote,
}: {
  post: Post;
  voted: boolean;
  onVote: () => void;
}) {
  return (
    <li className="surface px-4 py-3 hover:border-ink/40 transition-colors">
      <div className="flex items-start gap-3">
        {/* Vote column */}
        <button
          onClick={onVote}
          className={`flex flex-col items-center justify-start py-1 px-1.5 rounded-md transition-colors shrink-0 ${
            voted
              ? "bg-accent/10 text-accent"
              : "text-muted hover:bg-bg hover:text-ink"
          }`}
          aria-label={voted ? "Remove upvote" : "Upvote"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 3l4 5H3l4-5z" fill="currentColor" />
          </svg>
          <span className="text-xs font-mono mt-0.5">{post.upvotes}</span>
        </button>

        {/* Body column */}
        <Link href={`/browse/${post.id}`} className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
            <Pill size="sm" active>{CATEGORY_LABELS[post.category]}</Pill>
            <h3 className="text-sm font-semibold text-ink leading-snug">
              {post.title}
            </h3>
          </div>
          <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
            {post.body}
          </p>
          <div className="flex items-center gap-3 text-xxs text-muted mt-2 font-mono">
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={post.author_name} size={16} />
              {post.author_name}
            </span>
            <span>{timeAgo(post.created_at)}</span>
            <span>· {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}</span>
          </div>
        </Link>
      </div>
    </li>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}
