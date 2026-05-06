"use client";
import { TopBar } from "@/components/TopBar";
import { FounderCardView } from "@/components/FounderCard";
import { Button } from "@/components/primitive/Button";
import { useToast } from "@/components/primitive/Toast";
import { useParams, useRouter } from "next/navigation";
import { findById } from "@/lib/mock/cohort";

export default function BrowseDetailPage() {
  const params = useParams<{ id: string }>();
  const card = findById(params.id!);
  const toast = useToast();
  const router = useRouter();

  if (!card) {
    return (
      <>
        <TopBar back={{ href: "/browse" }} title="Not found" />
        <div className="container-app py-10 text-sm text-muted">No founder with that id.</div>
      </>
    );
  }

  return (
    <>
      <TopBar back={{ href: "/browse" }} title={card.name} />
      <section className="container-app pt-5 pb-10">
        <FounderCardView card={card} />
        <div className="mt-5 flex gap-2">
          <Button
            block
            onClick={() => {
              toast.push("Request flow goes through the Drop. We do not allow cold introduction outside curated drops.", "info");
              router.push("/drop");
            }}
          >
            Suggest in next Drop
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              toast.push("Saved to follow-ups", "info");
            }}
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          Browse is read-only. Cold messages are not allowed by design. To meet someone, ask the
          Matchmaker to consider them in your next curated Drop.
        </p>
      </section>
    </>
  );
}
