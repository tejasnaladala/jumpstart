# Critique C002: What happens after the 90-day window?

## The challenge

Jumpstart is bounded to SS 2026's three months. After that the cohort disperses. If the product was useful, users will be sad it ends. If it was not useful, no one notices.

## Three honest answers

1. **It is a 90-day tool by design.** Like Partiful is for one party. The success metric is not retention past day 91, it is intros and useful meetings during the program. After SS, Jumpstart goes read-only. Users keep their relationship map and contact list. They do not get new drops.

2. **There is a per-cohort path.** SS 2027 gets its own Jumpstart instance. Same product, different cohort. Verification carries over for users who attend multiple. The infrastructure is the same.

3. **There is an alumni path that is a different product.** A "Jumpstart Alumni" surface that connects past SS attendees who are now in active YC batches, working on similar things, hiring, raising. That is a separate product idea and not in scope for v1 of the SS 2026 product.

## What the spec currently says

Section 32 (failure modes) mentions this and acknowledges it is a real concern. Section 33 phase 5 hints at scale but does not commit to a per-cohort or alumni model.

## Recommendation

For the v1 vision: explicitly accept this as a 90-day tool. Do not build for retention past day 91. The success metric is what happens during the cohort. If users want more after, that is a v2 product decision based on what we learn.

This is also the honest answer in any YC outreach. "We built a 90-day tool, here is what happened during those 90 days" is a stronger story than "we built a network we hope grows forever".
