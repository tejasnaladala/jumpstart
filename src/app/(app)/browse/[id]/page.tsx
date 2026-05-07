"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Button } from "@/components/primitive/Button";
import { Pill } from "@/components/primitive/Pill";
import { Textarea } from "@/components/primitive/Input";
import { useToast } from "@/components/primitive/Toast";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loadMe } from "@/lib/mock/me";
import {
  CATEGORY_LABELS,
  appendComment,
  findPost,
  loadVotes,
  toggleUpvote,
  type Post,
} from "@/lib/forum/posts";
import { enqueue } from "@/lib/moderation/queue";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [voted, setVoted] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const meRef = useRef(loadMe());

  useEffect(() => {
    if (!params.id) return;
    const p = findPost(params.id);
    if (p) {
      setPost(p);
      setVoted(loadVotes().has(p.id));
    }
  }, [params.id]);

  if (!post) {
    return (
      <>
        <TopBar variant="compact" back={{ href: "/browse" }} title="Loading..." />
        <div className="container-app pt-6 pb-12 text-sm text-muted">Looking up the post...</div>
      </>
    );
  }

  function vote() {
    const result = toggleUpvote(post!.id);
    if (result) {
      setPost({ ...post!, upvotes: result.upvotes });
      setVoted(result.voted);
    }
  }

  function postComment() {
    const body = draft.trim();
    if (body.length < 1) return;
    setPosting(true);
    try {
      const result = appendComment(post!.id, {
        author_user_id: meRef.current.user_id,
        author_name: meRef.current.name || "Anonymous",
        body,
      });
      if (!result.ok) {
        toast.push("Comment blocked. Rewrite without targeting language.", "error");
        return;
      }
      setPost(result.post);
      setDraft("");
      if (result.flagged) {
        toast.push("Posted. An admin will review the language.", "info");
      }
    } catch {
      toast.push("Could not post comment. Try again.", "error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      <TopBar variant="compact" back={{ href: "/browse" }} title="Post" subtitle={post.author_name} />
      <section className="container-app pt-5 pb-12">
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Pill size="sm" active>
              {CATEGORY_LABELS[post.category]}
            </Pill>
            <span className="font-mono text-xxs text-muted">
              {timeAgo(post.created_at)}
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink leading-tight mb-3">
            {post.title}
          </h1>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border flex-wrap">
            <button
              onClick={vote}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${
                voted
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "border-border text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 3l4 5H3l4-5z" fill="currentColor" />
              </svg>
              {post.upvotes} {post.upvotes === 1 ? "upvote" : "upvotes"}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xxs text-muted font-mono">
              <Avatar name={post.author_name} size={18} />
              {post.author_name}
            </span>
            <button
              onClick={() => {
                // Per founder direction: any user can flag a post for
                // admin review. Goes into the same /admin/moderation
                // queue as the auto-flagged ones.
                const reason = window.prompt(
                  "Why are you reporting this post? (one short sentence)"
                );
                if (!reason || !reason.trim()) return;
                enqueue({
                  kind: "reported_post",
                  triggered_by: meRef.current.user_id,
                  target_id: post.id,
                  target_kind: "post",
                  target_label: post.title,
                  target_snippet: post.body.slice(0, 140),
                  reasons: [reason.trim()],
                  severity: "medium",
                });
                toast.push("Reported. An admin will review.", "info");
              }}
              className="ml-auto inline-flex items-center gap-1 text-xxs text-muted hover:text-error transition-colors"
            >
              Report
            </button>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-3">
            {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
          </p>

          {/* Comment composer at the top so the action is one tap from
              opening the page. Reddit/HN put it at the bottom; we put
              it up here because the cohort is small and we want to
              encourage participation. */}
          <div className="surface p-4 mb-4">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Comment on ${post.author_name.split(" ")[0]}'s post`}
              rows={3}
              maxLength={2000}
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xxs text-muted font-mono">
                {draft.length}/2000
              </span>
              <Button
                size="sm"
                onClick={postComment}
                loading={posting}
                disabled={draft.trim().length < 1}
              >
                Post comment
              </Button>
            </div>
          </div>

          {post.comments.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">
              No comments yet. First reply matters.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {post.comments.map((c) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="surface p-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar name={c.author_name} size={22} />
                      <span className="text-xs font-semibold text-ink">
                        {c.author_name}
                      </span>
                      <span className="font-mono text-xxs text-muted">
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>
    </>
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
