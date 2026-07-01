# Lucrator — Facebook Group Outreach

The value-first companion to the cold-email tool. Same discipline (curated
targets, logged activity, scored on the metric that matters) applied to Facebook
groups, where you **earn** the conversation instead of blasting it.

Groups worth being in ban overt self-promo, and Meta restricts accounts that
cold-DM. So the whole method is: join → give value → let them invite the DM.

## Files

| File | What |
|------|------|
| `data/groups.csv` | Your target list. Tier (1 = vertical owner groups, best), vertical, region, search pattern, the group's promo rule, and an admin-endorsement play. Fill `status`/`joinedAt`/`notes` as you work it. |
| `hooks.md` | 10 ready-to-post value hooks (one per vertical), each US + UK, plus a lingo cheat-sheet. |
| `data/activity-log.csv` | One row per post. Fill `dms` / `calls` / `booked` as they come in. |
| `stats.js` | `npm run fb:stats` — scores hooks, groups, and verticals by DMs → calls → booked. |

## Workflow

1. **Build the list.** Open `data/groups.csv`. For each row, search the pattern on
   Facebook, sort by members, check it's active (posts today), join. Mark
   `status=joined` and the date. Tier-1 vertical owner groups first — highest intent.
   Cross-match Tier-2 geo groups against the cities in `../data/leads.csv` so the
   same owner sees you in a group *and* in their inbox (double-touch lifts replies).
2. **Warm the profile.** Banner + bio + featured post must say what you do in 3
   seconds. Cold DMs from a blank profile get flagged.
3. **Give value 5:1.** Answer pain-signal posts ("anyone good with...", "my DMs are
   a mess", "missing calls after hours") with a genuinely useful reply + soft
   "happy to send the setup." Post a hook from `hooks.md` ~once/week per group.
4. **Move to DM only on a reply/react.** Never cold-DM the room.
5. **Log every post** in `data/activity-log.csv` with its `hookId`, then:

```bash
cd outreach
npm run fb:stats
```

Kill dead groups/hooks, double down on the winners.

## Rules that keep you un-banned

- No external links in post bodies (Meta suppresses reach + most rules ban it) —
  "DM me" / "comment and I'll send it."
- Follow each group's promo rule (the `selfPromoRule` column). Many allow promo
  only in a weekly thread.
- Rotate 8–12 groups deep, not 50 shallow. Recognition beats reach.
- Recommend your **existing clients** when consumers ask "can anyone recommend a
  good [X]?" — retention gold + silent proof to lurking owners.

## How it ties into the rest of outreach

The CTA is the same as the email tool: a **free audit** ("send me your page, I'll
show you where leads are slipping"). When someone bites, run
`npm run audit -- --for "<business>"` to generate their one-pager. The six audit
rows map each lead leak to the Lucrator module that fixes it — so the audit is
the pitch, whether the lead came from an inbox or a Facebook group.
