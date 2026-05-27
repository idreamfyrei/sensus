/**
 * Curated showcase content seeded by `pnpm db:seed-demo`.
 *
 * Builds out the demo creator accounts and a small museum of forms — one
 * per Sensus theme — each with realistic seeded responses and views.
 * Idempotent: re-running is safe; existing demo forms are skipped.
 */

import {
  and,
  eq,
  inArray,
  db,
  user as userTable,
  themesTable,
  formsTable,
  formSectionsTable,
  formFieldsTable,
  fieldOptionsTable,
  responsesTable,
  responseAnswersTable,
  formViewsTable,
  notDeleted,
  DEMO_CREATORS,
} from "@repo/database";
import { auth } from "@repo/auth";
import { generateSlug } from "@repo/services";
import type { FieldType } from "@repo/schemas/fields";

type DemoFieldOption = { label: string; value: string };
type DemoField = {
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: DemoFieldOption[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  maxRating?: number;
  minSelected?: number;
  maxSelected?: number;
};
type DemoForm = {
  slug: string;
  title: string;
  description: string;
  themeKey: string;
  visibility: "public" | "unlisted";
  layout: "one_per_screen" | "single_page";
  isTemplate: boolean;
  owner: "admin" | "guest";
  fields: DemoField[];
  responses: Array<Array<string | string[] | number | null>>;
  viewCount: number;
};

const DEMO_FORMS: DemoForm[] = [
  // -------- 1. Vaporwave: year-end favorites --------
  {
    slug: "year-end-favorites",
    title: "Year-end favorites",
    description: "A slow drive through the things that mattered this year.",
    themeKey: "vaporwave",
    visibility: "public",
    layout: "one_per_screen",
    isTemplate: true,
    owner: "admin",
    fields: [
      {
        type: "short_text",
        label: "What should we call you?",
        required: true,
        placeholder: "first name is fine",
        maxLength: 80,
      },
      {
        type: "single_select",
        label: "Pick a category you cared about most",
        required: true,
        options: [
          { label: "Music", value: "music" },
          { label: "Movies", value: "movies" },
          { label: "Games", value: "games" },
          { label: "Books", value: "books" },
          { label: "Shows", value: "shows" },
        ],
      },
      {
        type: "long_text",
        label: "Your one favorite, and why",
        placeholder: "A line is enough",
        maxLength: 280,
      },
      {
        type: "rating",
        label: "How was the year, overall?",
        maxRating: 5,
      },
    ],
    responses: [
      ["Mira", "music", "Phoebe Bridgers, every track was a small letter.", 4],
      ["Theo", "movies", "Past Lives. I wasn't ready.", 5],
      ["Aisha", "games", "Pizza Tower, no notes.", 4],
      ["Jonas", "books", "Babel by R.F. Kuang. Stayed up two nights.", 5],
      ["Riya", "shows", "Reservation Dogs. Felt like home.", 5],
      ["Cam", "music", "Caroline Polachek, on a loop.", 4],
      ["Noor", "movies", "Aftersun, again.", 4],
      ["Ben", "games", "Tears of the Kingdom. I lost weekends.", 5],
      ["Sofia", "books", "Tomorrow, and Tomorrow, and Tomorrow.", 5],
      ["Yuto", "movies", "Perfect Days, quiet and exact.", 5],
      ["Lea", "shows", "The Bear, season two ruined me.", 4],
      ["Ash", "games", "Cocoon. A small, perfect puzzle.", 5],
    ],
    viewCount: 142,
  },

  // -------- 2. Pixel: game jam signup --------
  {
    slug: "pixel-jam-26",
    title: "Pixel Jam '26 sign-up",
    description: "Two days, one theme, a lot of caffeine. Tell us how to find you.",
    themeKey: "pixel",
    visibility: "public",
    layout: "one_per_screen",
    isTemplate: true,
    owner: "admin",
    fields: [
      {
        type: "short_text",
        label: "Handle",
        required: true,
        placeholder: "the one your friends use",
        maxLength: 60,
      },
      {
        type: "email",
        label: "Email",
        required: true,
        placeholder: "we won't spam you",
      },
      {
        type: "dropdown",
        label: "Pick a vibe",
        required: true,
        options: [
          { label: "Just here to learn", value: "learn" },
          { label: "Comfortable shipping", value: "comfortable" },
          { label: "Veteran jammer", value: "veteran" },
        ],
      },
      {
        type: "single_select",
        label: "Solo or squad?",
        required: true,
        options: [
          { label: "Solo run", value: "solo" },
          { label: "Looking for a team", value: "looking" },
          { label: "I have a team", value: "have" },
        ],
      },
      {
        type: "long_text",
        label: "Anything you want us to know?",
        maxLength: 500,
      },
    ],
    responses: [
      ["pixelpants", "p@ex.dev", "comfortable", "looking", "I draw, I'd love a coder."],
      ["sprinkler", "s@ex.dev", "veteran", "have", "Team of three, ready."],
      ["echo_", "e@ex.dev", "learn", "solo", "Beginner. Excited."],
      ["bytebird", "bb@ex.dev", "comfortable", "looking", "Looking for art."],
      ["rosie", "r@ex.dev", "veteran", "have", "Pre-formed, just registering."],
      ["nikomori", "n@ex.dev", "comfortable", "solo", "Bringing a small idea."],
      ["doomtaco", "d@ex.dev", "learn", "looking", "First jam, hi everyone."],
      ["miraj", "m@ex.dev", "veteran", "looking", "Coder, looking for music."],
      ["sea_lion", "sl@ex.dev", "comfortable", "solo", "Quiet entry this year."],
      ["pebble", "pb@ex.dev", "learn", "looking", "Will trade pixel art for hugs."],
    ],
    viewCount: 318,
  },

  // -------- 3. Museum: reading club --------
  {
    slug: "reading-room",
    title: "Reading room sign-up",
    description: "We meet once a month, in person, over tea and a book.",
    themeKey: "museum",
    visibility: "public",
    layout: "single_page",
    isTemplate: true,
    owner: "admin",
    fields: [
      {
        type: "short_text",
        label: "Your name",
        required: true,
        maxLength: 80,
      },
      {
        type: "email",
        label: "Email",
        required: true,
        placeholder: "for the monthly note",
      },
      {
        type: "single_select",
        label: "What pulls you in?",
        required: true,
        options: [
          { label: "Fiction", value: "fiction" },
          { label: "Non-fiction", value: "nonfiction" },
          { label: "Essays", value: "essays" },
          { label: "Poetry", value: "poetry" },
        ],
      },
      {
        type: "short_text",
        label: "One book everyone should read",
        maxLength: 140,
      },
    ],
    responses: [
      ["Helen Park", "helen@ex.dev", "essays", "On Photography"],
      ["Arjun Mehta", "arjun@ex.dev", "fiction", "A Little Life"],
      ["Mei Tanaka", "mei@ex.dev", "poetry", "Devotions, Mary Oliver"],
      ["Sam Reyes", "sam@ex.dev", "fiction", "Klara and the Sun"],
      ["Imani Cole", "imani@ex.dev", "nonfiction", "Just Kids"],
      ["Pedro Alvarez", "pedro@ex.dev", "essays", "Trick Mirror"],
      ["Nina Berg", "nina@ex.dev", "fiction", "Pachinko"],
      ["Yusuf Khan", "yusuf@ex.dev", "poetry", "Night Sky with Exit Wounds"],
    ],
    viewCount: 86,
  },

  // -------- 4. Anime: con feedback --------
  {
    slug: "anime-con-feedback",
    title: "How was the con?",
    description: "Tell us the parts that hit. We're already planning next year.",
    themeKey: "anime",
    visibility: "public",
    layout: "one_per_screen",
    isTemplate: true,
    owner: "admin",
    fields: [
      {
        type: "rating",
        label: "Overall",
        required: true,
        maxRating: 5,
      },
      {
        type: "multi_select",
        label: "Which panels did you catch?",
        options: [
          { label: "Voice acting Q&A", value: "voice" },
          { label: "Indie studios panel", value: "indie" },
          { label: "Cosplay craft workshop", value: "cosplay" },
          { label: "Manga writers' room", value: "manga" },
          { label: "Soundtrack live show", value: "ost" },
        ],
      },
      {
        type: "long_text",
        label: "Best moment of the weekend?",
        placeholder: "Two lines is plenty",
        maxLength: 300,
      },
      {
        type: "checkbox",
        label: "I'd come back next year",
      },
    ],
    responses: [
      [5, ["voice", "ost"], "The OST set on Saturday night. Lights down, full hall singing.", true],
      [4, ["cosplay", "manga"], "Workshop with the costume designer was kind and detailed.", true],
      [5, ["voice", "indie", "ost"], "Panel where two voice actors actually performed live.", true],
      [3, ["manga"], "Long lines for some things. The writers room itself was great.", true],
      [4, ["cosplay"], "Met three friends I'd only known online. Worth the trip.", true],
      [5, ["indie", "ost"], "Indie studio showcase, found two games to wishlist.", true],
      [4, ["voice"], "Soft moment when the cast read fan letters.", true],
      [5, ["voice", "cosplay", "ost"], "All of it. Already saving for next year.", true],
      [2, [], "Hotel was rough. The con itself was fine.", false],
    ],
    viewCount: 421,
  },

  // -------- 5. Terminal: studio standup (unlisted) --------
  {
    slug: "studio-standup",
    title: "Studio standup",
    description: "Three lines. No meetings. Drop in by 11.",
    themeKey: "terminal",
    visibility: "unlisted",
    layout: "single_page",
    isTemplate: false,
    owner: "guest",
    fields: [
      {
        type: "short_text",
        label: "Name",
        required: true,
      },
      {
        type: "long_text",
        label: "What you shipped",
        required: true,
        maxLength: 280,
      },
      {
        type: "long_text",
        label: "What's blocking",
        maxLength: 280,
      },
      {
        type: "checkbox",
        label: "Calendar is full today",
      },
    ],
    responses: [
      [
        "Wren",
        "Shipped the analytics page. Charts in, CSV download in.",
        "Nothing blocking, will start onboarding tomorrow.",
        false,
      ],
      [
        "Kavi",
        "Email templates done, mock fallback wired.",
        "Need a domain to actually test the production send.",
        true,
      ],
      ["Sora", "Visibility picker live in the builder.", "", false],
      ["Lior", "Patched the soft-delete leak in responses.list.", "Waiting on review.", false],
      [
        "Ines",
        "Demo seed in flight, six themed forms.",
        "Need someone to proof-read the copy.",
        false,
      ],
    ],
    viewCount: 64,
  },

  // -------- 6. Brutalist: after-show notes --------
  {
    slug: "after-show-notes",
    title: "After-show notes",
    description: "The play just closed. Tell us what stayed with you.",
    themeKey: "brutalist",
    visibility: "public",
    layout: "single_page",
    isTemplate: false,
    owner: "admin",
    fields: [
      {
        type: "short_text",
        label: "Name",
        maxLength: 60,
      },
      {
        type: "email",
        label: "Email (optional, if you want updates)",
      },
      {
        type: "rating",
        label: "Production overall",
        required: true,
        maxRating: 5,
      },
      {
        type: "single_select",
        label: "Favorite scene",
        options: [
          { label: "The kitchen, act one", value: "kitchen" },
          { label: "The phone call", value: "phone" },
          { label: "The walk to the lake", value: "lake" },
          { label: "The last monologue", value: "monologue" },
        ],
      },
      {
        type: "long_text",
        label: "What stayed with you?",
        maxLength: 600,
      },
    ],
    responses: [
      [
        "Hana",
        "hana@ex.dev",
        5,
        "monologue",
        "The way the room went still. I'm still thinking about it on the train.",
      ],
      [
        "Marcus",
        "",
        4,
        "phone",
        "The phone call landed harder than I expected. Real silence in the audience.",
      ],
      [
        "Daniela",
        "dani@ex.dev",
        5,
        "kitchen",
        "Such a quiet opening. We were hooked before we knew it.",
      ],
      ["Owen", "owen@ex.dev", 4, "lake", "Loved the lake scene. Felt almost like a film."],
      ["Priya", "", 5, "monologue", "Best last fifteen minutes I've seen this year."],
      ["Tom", "tom@ex.dev", 3, "phone", "Strong cast. Some pacing in act two could be tighter."],
      ["Lena", "lena@ex.dev", 5, "kitchen", "I want to come again with my mother."],
    ],
    viewCount: 108,
  },
];

async function ensureUser(creds: {
  name: string;
  email: string;
  password: string;
}): Promise<string> {
  const [existing] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, creds.email))
    .limit(1);
  if (existing) return existing.id;
  await auth.api.signUpEmail({ body: creds });
  const [row] = await db.select().from(userTable).where(eq(userTable.email, creds.email)).limit(1);
  if (!row) throw new Error(`sign-up failed for ${creds.email}`);
  return row.id;
}

async function getThemeIdByKey(key: string): Promise<string> {
  const [row] = await db
    .select({ id: themesTable.id })
    .from(themesTable)
    .where(eq(themesTable.key, key as never));
  if (!row) throw new Error(`theme not seeded: ${key}`);
  return row.id;
}

async function formAlreadySeeded(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: formsTable.id })
    .from(formsTable)
    .where(and(eq(formsTable.slug, slug), notDeleted(formsTable.deletedAt)))
    .limit(1);
  return Boolean(row);
}

async function seedOneForm(args: {
  form: DemoForm;
  ownerId: string;
  themeId: string;
}): Promise<void> {
  const { form, ownerId, themeId } = args;
  const slug = form.slug;

  if (await formAlreadySeeded(slug)) {
    console.log(`  skip ${slug} (already seeded)`);
    return;
  }

  // form
  const [insertedForm] = await db
    .insert(formsTable)
    .values({
      userId: ownerId,
      title: form.title,
      description: form.description,
      slug,
      slugIsCustom: true,
      themeId,
      visibility: form.visibility,
      layout: form.layout,
      isTemplate: form.isTemplate,
      status: "published",
      version: 2,
    })
    .returning();
  if (!insertedForm) throw new Error(`failed to insert form ${slug}`);

  // section
  const [section] = await db
    .insert(formSectionsTable)
    .values({ formId: insertedForm.id, order: 0 })
    .returning();
  if (!section) throw new Error(`failed to insert section for ${slug}`);

  // fields
  const insertedFieldIds: string[] = [];
  for (let i = 0; i < form.fields.length; i++) {
    const f = form.fields[i]!;
    const [row] = await db
      .insert(formFieldsTable)
      .values({
        formId: insertedForm.id,
        sectionId: section.id,
        type: f.type,
        label: f.label,
        description: f.description ?? null,
        placeholder: f.placeholder ?? null,
        required: f.required ?? false,
        order: i,
        minLength: f.minLength ?? null,
        maxLength: f.maxLength ?? null,
        min: f.min ?? null,
        max: f.max ?? null,
        maxRating: f.maxRating ?? null,
        minSelected: f.minSelected ?? null,
        maxSelected: f.maxSelected ?? null,
      })
      .returning();
    if (!row) throw new Error(`field insert failed for ${slug}`);
    insertedFieldIds.push(row.id);

    if (f.options && f.options.length > 0) {
      await db.insert(fieldOptionsTable).values(
        f.options.map((opt, idx) => ({
          fieldId: row.id,
          label: opt.label,
          value: opt.value,
          order: idx,
        })),
      );
    }
  }

  // responses + answers
  for (const responseRow of form.responses) {
    const submittedAt = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    const [resp] = await db
      .insert(responsesTable)
      .values({
        formId: insertedForm.id,
        submittedAt,
      })
      .returning();
    if (!resp) throw new Error(`response insert failed for ${slug}`);

    for (let i = 0; i < responseRow.length; i++) {
      const fieldId = insertedFieldIds[i];
      const value = responseRow[i];
      if (!fieldId || value === null || value === undefined) continue;

      const fieldDef = form.fields[i]!;
      const isJson = fieldDef.type === "multi_select" || Array.isArray(value);
      await db.insert(responseAnswersTable).values({
        responseId: resp.id,
        formFieldId: fieldId,
        valueText: isJson ? null : String(value),
        valueJson: isJson ? value : null,
      });
    }
  }

  // views, spread across the last 30 days
  const viewRows: Array<{ formId: string; viewedAt: Date }> = [];
  for (let i = 0; i < form.viewCount; i++) {
    viewRows.push({
      formId: insertedForm.id,
      viewedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
    });
  }
  // batch insert in chunks of 100 to keep statements reasonable
  for (let i = 0; i < viewRows.length; i += 100) {
    await db.insert(formViewsTable).values(viewRows.slice(i, i + 100));
  }

  console.log(`  ok   ${slug} — ${form.responses.length} responses, ${form.viewCount} views`);
  void inArray;
}

async function main() {
  console.log("seeding demo content…");

  const adminId = await ensureUser(DEMO_CREATORS.admin);
  const guestId = await ensureUser(DEMO_CREATORS.guest);
  console.log(`  users: ${DEMO_CREATORS.admin.email}, ${DEMO_CREATORS.guest.email}`);

  for (const form of DEMO_FORMS) {
    const themeId = await getThemeIdByKey(form.themeKey);
    const ownerId = form.owner === "admin" ? adminId : guestId;
    await seedOneForm({ form, ownerId, themeId });
  }

  console.log("\n✅ demo seed complete");
  console.log(`   sign in as: ${DEMO_CREATORS.admin.email} / ${DEMO_CREATORS.admin.password}`);
  console.log(`   judge view: ${DEMO_CREATORS.guest.email} / ${DEMO_CREATORS.guest.password}`);
}

void generateSlug;

main()
  .catch((err) => {
    console.error("seed-demo failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
