import { TopBar } from "@/components/TopBar";

export default function DropLoading() {
  return (
    <>
      <TopBar title="Your Drop" subtitle="Curating..." />
      <section className="container-app pt-5 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="pill pill-accent text-xs">3 worth meeting</span>
          <span className="text-xs text-muted">curating for you</span>
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full skeleton" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 w-1/3 skeleton" />
                  <div className="h-3 w-2/3 skeleton" />
                  <div className="h-12 w-full skeleton mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
