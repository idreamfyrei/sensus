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
  fieldConditionsTable,
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
  pattern?: string;
  isInteger?: boolean;
  includeTime?: boolean;
  maxRating?: number;
  minSelected?: number;
  maxSelected?: number;
};
type DemoSection = {
  title?: string;
  description?: string;
  pageBreakBefore?: boolean;
  showIntroScreen?: boolean;
  fields: DemoField[];
};
type DemoCondition = {
  sourceLabel: string;
  operator: "eq" | "neq" | "contains" | "gt" | "lt" | "empty" | "not_empty";
  value?: string | null;
  action: "show" | "hide" | "require" | "jump_to";
  targetLabel?: string;
  targetSectionTitle?: string;
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
  sections?: DemoSection[];
  conditions?: DemoCondition[];
  responses: Array<Array<string | string[] | number | null>>;
  viewCount: number;
};

const DEMO_FORMS: DemoForm[] = [
  {
    slug: "sensus-feature-showcase",
    title: "Sensus feature showcase",
    description:
      "A full-system QA form with every field type, validation controls, sections, intros, page breaks, and conditional logic.",
    themeKey: "brutalist",
    visibility: "public",
    layout: "one_per_screen",
    isTemplate: true,
    owner: "admin",
    fields: [],
    sections: [
      {
        title: "Identity and contact",
        description: "Basic respondent details plus text validation.",
        showIntroScreen: true,
        fields: [
          {
            type: "short_text",
            label: "Display name",
            required: true,
            placeholder: "Ada Lovelace",
            minLength: 2,
            maxLength: 80,
          },
          {
            type: "email",
            label: "Work email",
            required: true,
            placeholder: "ada@example.com",
          },
          {
            type: "long_text",
            label: "Project context",
            required: true,
            placeholder: "Tell us what you are trying to collect.",
            minLength: 10,
            maxLength: 500,
          },
        ],
      },
      {
        title: "Choices and scoring",
        description: "Option fields, numeric limits, ratings, and a confirmation checkbox.",
        pageBreakBefore: true,
        showIntroScreen: true,
        fields: [
          {
            type: "single_select",
            label: "Primary use case",
            required: true,
            options: [
              { label: "Feedback", value: "feedback" },
              { label: "Registration", value: "registration" },
              { label: "Research", value: "research" },
              { label: "Internal ops", value: "ops" },
            ],
          },
          {
            type: "multi_select",
            label: "Features to test",
            required: true,
            minSelected: 2,
            maxSelected: 4,
            options: [
              { label: "Analytics", value: "analytics" },
              { label: "Conditional logic", value: "logic" },
              { label: "Themes", value: "themes" },
              { label: "Responses", value: "responses" },
              { label: "Validation", value: "validation" },
            ],
          },
          {
            type: "dropdown",
            label: "Launch urgency",
            required: true,
            options: [
              { label: "This week", value: "week" },
              { label: "This month", value: "month" },
              { label: "Later", value: "later" },
            ],
          },
          {
            type: "number",
            label: "Expected responses",
            required: true,
            min: 1,
            max: 10000,
            isInteger: true,
          },
          {
            type: "rating",
            label: "Builder experience",
            required: true,
            maxRating: 10,
          },
          {
            type: "checkbox",
            label: "I want to test conditional logic",
            required: false,
          },
        ],
      },
      {
        title: "Scheduling and conditional follow-up",
        description: "Date input plus fields controlled by conditional rules.",
        pageBreakBefore: true,
        showIntroScreen: true,
        fields: [
          {
            type: "date",
            label: "Preferred review date",
            required: true,
            includeTime: false,
          },
          {
            type: "long_text",
            label: "Logic test notes",
            description: "Shown when the conditional-logic checkbox is checked.",
            placeholder: "Describe the branch you expected to see.",
            maxLength: 300,
          },
          {
            type: "email",
            label: "Urgent contact email",
            description: "Required when launch urgency is this week.",
            placeholder: "owner@example.com",
          },
          {
            type: "long_text",
            label: "Low rating follow-up",
            description: "Shown when builder experience is under 7.",
            placeholder: "What should be improved first?",
            maxLength: 300,
          },
          {
            type: "long_text",
            label: "Non-later launch note",
            description: "Hidden when launch urgency is Later.",
            placeholder: "Anything time-sensitive we should know?",
            maxLength: 300,
          },
        ],
      },
    ],
    conditions: [
      {
        sourceLabel: "I want to test conditional logic",
        operator: "eq",
        value: "true",
        action: "show",
        targetLabel: "Logic test notes",
      },
      {
        sourceLabel: "Launch urgency",
        operator: "eq",
        value: "week",
        action: "require",
        targetLabel: "Urgent contact email",
      },
      {
        sourceLabel: "Builder experience",
        operator: "lt",
        value: "7",
        action: "show",
        targetLabel: "Low rating follow-up",
      },
      {
        sourceLabel: "Launch urgency",
        operator: "eq",
        value: "later",
        action: "hide",
        targetLabel: "Non-later launch note",
      },
      {
        sourceLabel: "Primary use case",
        operator: "eq",
        value: "research",
        action: "jump_to",
        targetSectionTitle: "Scheduling and conditional follow-up",
      },
    ],
    responses: [
      [
        "Saumya",
        "saumya@example.com",
        "Testing every implemented Sensus field and branch.",
        "feedback",
        ["analytics", "logic", "themes"],
        "week",
        250,
        9,
        "true",
        "2026-06-20",
        "The notes field appeared after checking the box.",
        "owner@example.com",
        null,
        "We are launching this week, so timing matters.",
      ],
      [
        "Mira",
        "mira@example.com",
        "Checking validations, options, and a low rating branch.",
        "ops",
        ["responses", "validation"],
        "month",
        80,
        5,
        "false",
        "2026-07-02",
        null,
        null,
        "The field editor could explain rules more clearly.",
        "Monthly launch, no special rush.",
      ],
      [
        "Arjun",
        "arjun@example.com",
        "Using the showcase as a template before publishing.",
        "research",
        ["logic", "responses", "validation", "analytics"],
        "later",
        1200,
        8,
        "true",
        "2026-07-15",
        "Jump-to-section behavior is the main branch to verify.",
        null,
        null,
        null,
      ],
    ],
    viewCount: 64,
  },

  {
    slug: "chai-code-sensus-feedback",
    title: "Chai Code Sensus feedback",
    description:
      "A cheerful judge-facing form about whether Sensus fits the purpose, how the builder felt, and how fun the cohort learning experience has been.",
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
        placeholder: "Your name",
        maxLength: 80,
      },
      {
        type: "single_select",
        label: "Does this form fill the purpose?",
        required: true,
        options: [
          { label: "Yes, it feels clear and useful", value: "clear-useful" },
          { label: "Yes, it gets the idea across quickly", value: "quickly-clear" },
          { label: "Yes, it is demo-ready and judge-friendly", value: "judge-friendly" },
          { label: "Yes, it made me smile while testing", value: "made-me-smile" },
        ],
      },
      {
        type: "rating",
        label: "How was the form building experience?",
        required: true,
        maxRating: 5,
      },
      {
        type: "multi_select",
        label: "What felt fun while building with Sensus?",
        required: true,
        minSelected: 2,
        maxSelected: 4,
        options: [
          { label: "Creating questions felt smooth", value: "smooth-questions" },
          { label: "Themes made the form feel alive", value: "themes-alive" },
          { label: "The preview made iteration easy", value: "easy-preview" },
          { label: "Conditional logic felt satisfying", value: "logic-satisfying" },
          { label: "Publishing a shareable link felt great", value: "share-link" },
        ],
      },
      {
        type: "single_select",
        label: "Are you enjoying the Chai Code cohort?",
        required: true,
        options: [
          { label: "Absolutely, the cohort energy is amazing", value: "amazing-energy" },
          { label: "Yes, learning with everyone feels motivating", value: "motivating" },
          { label: "Yes, it feels like building with friends", value: "building-with-friends" },
          { label: "Yes, the chai plus code combo is elite", value: "chai-code-elite" },
        ],
      },
      {
        type: "dropdown",
        label: "How has the learning experience felt?",
        required: true,
        options: [
          { label: "Fun and practical", value: "fun-practical" },
          { label: "Hands-on and confidence-building", value: "confidence-building" },
          { label: "Challenging in the best way", value: "best-challenge" },
          { label: "Full of tiny wins", value: "tiny-wins" },
        ],
      },
      {
        type: "long_text",
        label: "One happy note for the judges",
        required: true,
        placeholder: "Sensus helped me turn the idea into something I can actually share.",
        minLength: 10,
        maxLength: 400,
      },
      {
        type: "checkbox",
        label: "I would happily show this form in the final demo",
        required: true,
      },
    ],
    responses: [
      [
        "Saumya",
        "judge-friendly",
        5,
        ["smooth-questions", "themes-alive", "easy-preview", "share-link"],
        "chai-code-elite",
        "fun-practical",
        "Sensus made the form-building flow feel playful, useful, and polished enough to show judges.",
        true,
      ],
      [
        "A Chai Code buddy",
        "quickly-clear",
        5,
        ["smooth-questions", "logic-satisfying", "share-link"],
        "building-with-friends",
        "confidence-building",
        "The project feels like a real product, and the learning journey has been genuinely fun.",
        true,
      ],
      [
        "Demo reviewer",
        "clear-useful",
        4,
        ["themes-alive", "easy-preview", "logic-satisfying"],
        "motivating",
        "tiny-wins",
        "The form explains the purpose clearly and keeps the tone positive from start to finish.",
        true,
      ],
      [
        "Future user",
        "made-me-smile",
        5,
        ["smooth-questions", "themes-alive", "share-link"],
        "amazing-energy",
        "best-challenge",
        "It feels friendly, fast, and ready for a cohort project showcase.",
        true,
      ],
    ],
    viewCount: 108,
  },

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

  const sections =
    form.sections && form.sections.length > 0
      ? form.sections
      : [{ fields: form.fields } satisfies DemoSection];
  const fieldsForResponses = sections.flatMap((section) => section.fields);

  const insertedFieldIds: string[] = [];
  const fieldIdByLabel = new Map<string, string>();
  const sectionIdByTitle = new Map<string, string>();

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const sectionDef = sections[sectionIndex]!;
    const [section] = await db
      .insert(formSectionsTable)
      .values({
        formId: insertedForm.id,
        order: sectionIndex,
        title: sectionDef.title ?? null,
        description: sectionDef.description ?? null,
        pageBreakBefore: sectionDef.pageBreakBefore ?? false,
        showIntroScreen: sectionDef.showIntroScreen ?? false,
      })
      .returning();
    if (!section) throw new Error(`failed to insert section for ${slug}`);
    if (sectionDef.title) sectionIdByTitle.set(sectionDef.title, section.id);

    for (let fieldIndex = 0; fieldIndex < sectionDef.fields.length; fieldIndex++) {
      const f = sectionDef.fields[fieldIndex]!;
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
          order: fieldIndex,
          minLength: f.minLength ?? null,
          maxLength: f.maxLength ?? null,
          min: f.min ?? null,
          max: f.max ?? null,
          pattern: f.pattern ?? null,
          isInteger: f.isInteger ?? null,
          includeTime: f.includeTime ?? null,
          maxRating: f.maxRating ?? null,
          minSelected: f.minSelected ?? null,
          maxSelected: f.maxSelected ?? null,
        })
        .returning();
      if (!row) throw new Error(`field insert failed for ${slug}`);
      insertedFieldIds.push(row.id);
      fieldIdByLabel.set(f.label, row.id);

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
  }

  if (form.conditions && form.conditions.length > 0) {
    await db.insert(fieldConditionsTable).values(
      form.conditions.map((condition) => {
        const sourceFieldId = fieldIdByLabel.get(condition.sourceLabel);
        if (!sourceFieldId) throw new Error(`condition source not found: ${condition.sourceLabel}`);

        const targetFieldId = condition.targetLabel
          ? fieldIdByLabel.get(condition.targetLabel)
          : undefined;
        const targetSectionId = condition.targetSectionTitle
          ? sectionIdByTitle.get(condition.targetSectionTitle)
          : undefined;

        if (!targetFieldId && !targetSectionId) {
          throw new Error(
            `condition target not found: ${condition.targetLabel ?? condition.targetSectionTitle}`,
          );
        }

        return {
          formId: insertedForm.id,
          sourceFieldId,
          operator: condition.operator,
          value: condition.value ?? null,
          action: condition.action,
          targetFieldId: targetFieldId ?? null,
          targetSectionId: targetSectionId ?? null,
        };
      }),
    );
  }

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

      const fieldDef = fieldsForResponses[i]!;
      const isJson = fieldDef.type === "multi_select" || Array.isArray(value);
      await db.insert(responseAnswersTable).values({
        responseId: resp.id,
        formFieldId: fieldId,
        valueText: isJson ? null : String(value),
        valueJson: isJson ? value : null,
      });
    }
  }

  const viewRows: Array<{ formId: string; viewedAt: Date }> = [];
  for (let i = 0; i < form.viewCount; i++) {
    viewRows.push({
      formId: insertedForm.id,
      viewedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
    });
  }
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
