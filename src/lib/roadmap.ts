// Loads data/roadmap.yaml and validates it. Runs at build time only; an invalid file fails the build.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'astro/zod';

const text = z.string().min(1);
const slug = z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, digits and dashes');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD');
const day = z.number().int().min(1);

const week = z.strictObject({
  id: slug,
  number: z.number().int().min(1).optional(),
  short: text,
  start: day,
  end: day,
  title: text,
  learn: text,
  build: text,
  build_sub: z.string().optional(),
  interview: text,
  dsa: z.string().optional(),
  race: z.boolean().optional(),
  event: z.string().optional(), // race name, e.g. Khadakwasla Ultra
  project: slug.optional(), // a projects id: the core project this week builds
  build_steps: z.array(text).optional(),
  build_links: z.array(z.strictObject({ label: text, url: z.url() })).optional(),
});

const resource = z.strictObject({
  id: slug,
  week: slug,
  title: text,
  url: z.url().optional(),
  category: z.enum(['video', 'course', 'docs', 'book', 'essay', 'repo', 'tool', 'standard']),
  type: z.string().optional(),
  cost: text,
  time: text,
  priority: z.enum(['must', 'recommended', 'optional']),
  verified_on: isoDate.optional(),
  license: z.literal('link-only').optional(),
  why: text,
});

const star = z.strictObject({
  id: slug,
  prompt: text,
  sample: z
    .strictObject({ title: text, tags: text, s: text, t: text, a: text, r: text })
    .optional(),
});

export const roadmapSchema = z
  .strictObject({
    meta: z.strictObject({
      name: text,
      title: text,
      start_date: isoDate,
      days: day,
      hours: z.strictObject({ learn: z.number(), build: z.number(), interview: z.number() }),
      budget_cap_usd: z.number().positive(),
      repo: z.url(),
      plan_doc: text,
    }),
    author: z.strictObject({
      name: text,
      role: text,
      bio: z.array(text).min(1),
      links: z.array(z.strictObject({ label: text, url: z.url(), note: z.string().optional() })),
    }),
    about: z.strictObject({
      intro: text,
      constraints: z.array(z.strictObject({ label: text, value: text })),
      tracks: z.strictObject({ learn: text, build: text, interview: text }),
      rhythm: z.strictObject({ weekdays: z.array(text), weekends: z.array(text) }),
    }),
    weeks: z.array(week).min(1),
    resources: z.array(resource),
    checkpoints: z.array(z.strictObject({ id: slug, day, title: text })),
    projects: z.array(
      z.strictObject({ id: slug, number: z.number().int(), title: text, weeks: text, summary: text, proves: text, study: text }),
    ),
    deliverables: z.array(text).min(1),
    readme_template: z.array(text),
    existing_projects: z.array(z.strictObject({ name: text, what: text, role: text })),
    ideas: z.array(z.strictObject({ name: text, verdict: text })),
    questions: z.array(z.strictObject({ id: slug, q: text, points: z.array(text).min(1) })).min(1),
    dsa: z.array(z.strictObject({ id: slug, label: text, target: z.number().int().min(1) })),
    mocks: z.array(z.strictObject({ id: slug, title: text, when: text })),
    interview_loops: z.array(text),
    stars: z.array(star),
    costs: z.array(z.strictObject({ item: text, cost: text, note: text })),
    ecosystem: z.array(
      z.strictObject({
        date: text,
        tag: z.enum(['Standard', 'Spec', 'Security', 'Tooling', 'Acquisition']),
        title: text,
        meaning: text,
        url: z.url().optional(),
      }),
    ),
  })
  .superRefine((r, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    // Weeks must tile days 1..N with no gaps, and at most one can be the race.
    let next = 1;
    for (const w of r.weeks) {
      if (w.start !== next || w.end < w.start) fail(`week ${w.id}: expected to start on day ${next}`);
      next = w.end + 1;
    }
    if (next - 1 !== r.meta.days) fail(`weeks end on day ${next - 1}, meta.days is ${r.meta.days}`);
    if (r.weeks.filter((w) => w.race).length > 1) fail('only one week can have race: true');
    if (r.weeks[0]?.race) fail('the race cannot be the first week');

    const weekIds = new Set(r.weeks.map((w) => w.id));
    for (const res of r.resources) if (!weekIds.has(res.week)) fail(`resource ${res.id}: unknown week "${res.week}"`);
    for (const c of r.checkpoints) if (c.day > r.meta.days) fail(`checkpoint ${c.id}: day ${c.day} is past the plan`);
    const projectIds = new Set(r.projects.map((p) => p.id));
    for (const w of r.weeks) if (w.project && !projectIds.has(w.project)) fail(`week ${w.id}: unknown project "${w.project}"`);

    const lists = { weeks: r.weeks, resources: r.resources, checkpoints: r.checkpoints, projects: r.projects, questions: r.questions, dsa: r.dsa, mocks: r.mocks, stars: r.stars };
    for (const [name, list] of Object.entries(lists)) {
      const seen = new Set<string>();
      for (const { id } of list) {
        if (seen.has(id)) fail(`${name}: duplicate id "${id}"`);
        seen.add(id);
      }
    }
  });

export type Roadmap = z.infer<typeof roadmapSchema>;
export type Week = Roadmap['weeks'][number];
export type Resource = Roadmap['resources'][number];

export function loadRoadmap(path = 'data/roadmap.yaml'): Roadmap {
  const result = roadmapSchema.safeParse(parse(readFileSync(path, 'utf8')));
  if (!result.success) throw new Error(`${path} is invalid:\n${z.prettifyError(result.error)}`);
  return result.data;
}
