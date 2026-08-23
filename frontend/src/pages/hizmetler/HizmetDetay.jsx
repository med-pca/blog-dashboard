import { useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  ChefHat,
  CookingPot,
  PiggyBank,
  Utensils,
  Wrench,
  Timer,
  CalendarDays,
  Sparkles,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SEO from "../../components/SEO";
import AdSenseBlock from "../../components/AdSenseBlock";
import { SITE_URL } from "../../lib/site";

const services = [
  {
    slug: "meal-prep",
    icon: ChefHat,
    title: "Meal Prep & Batch Cooking",
    photo: "/guides/meal-prep-planning.webp",
    photoAlt:
      "Weekly meal prep plan with organized balanced meals and a shopping list",
    subtitle: "Cook once, eat well all week — without eating the same thing twice.",
    description:
      "Most meal prep advice fails on the same point: it tells you to cook five identical portions on Sunday and then acts surprised when you order takeaway on Wednesday. Batch cooking works better when you prepare components rather than finished meals — a tray of roasted vegetables, a pot of grains, a jar of dressing — and assemble them differently each night.",
    description2:
      "That shift changes what you shop for and how you use the fridge. Instead of five sealed containers of the same stew, you get a set of parts that recombine into a bowl on Monday, a wrap on Tuesday and a fried rice on Thursday. The cooking happens once; the variety happens at assembly.",
    body: [
      "Start with the two things that take longest and reheat best: a grain and a protein. Rice, farro and lentils all hold for four or five days. Roasted chicken thighs, braised beans and hard-boiled eggs do the same. Cook those in quantity and everything else becomes a ten-minute decision.",
      "Vegetables are where prep usually goes wrong. Anything roasted holds well; anything dressed does not. Keep the dressing in a separate jar and add it at the last moment, or you will open a container on day three and find a soft, grey salad. Raw vegetables cut for snacking are the exception — carrots and peppers in water stay crisp for days.",
      "Storage decides how much of your work survives. Cool things quickly and completely before the lid goes on, because trapped steam condenses and turns a crisp thing soft. Label anything that goes into the freezer with a date, and freeze in the portion you will actually thaw rather than one large block you have to break apart with a knife.",
    ],
    features: [
      "Prep components, not finished meals",
      "One grain and one protein carry the week",
      "Dressings stored separately, added on the plate",
      "Cool food completely before sealing it",
      "Freeze in single portions, labelled with a date",
      "Plan one assembly-only night for when the week goes wrong",
    ],
    faq: [
      {
        q: "How many days ahead can I safely prep?",
        a: "Cooked grains, roasted vegetables and braised proteins hold three to four days in the fridge. Anything with raw dairy or fresh herbs stirred through is better made the day you eat it. If you want a full week, cook for four days and freeze the rest.",
      },
      {
        q: "Does batch cooking actually save money?",
        a: "It saves money mostly by reducing waste and takeaway. Buying a whole chicken or a large bag of lentils lowers the unit cost, but the real saving is that ingredients get used instead of turning to compost at the back of the fridge.",
      },
      {
        q: "How do I stop prepped food from tasting flat?",
        a: "Season in two stages. Salt during cooking as normal, then add something sharp or fresh at the moment of eating — lemon, vinegar, herbs, chilli. Reheating dulls acidity and aroma first, so those are the things worth adding back.",
      },
    ],
    related: [
      { slug: "meal-prep-without-boredom", title: "Meal Prep Without Eating the Same Thing Five Days Running" },
      { slug: "freezing-food-properly", title: "Freezing Food Properly: What Works, What Does Not" },
      { slug: "overnight-oats-five-ways", title: "Overnight Oats, Five Ways, Without the Sad Jar" },
    ],
  },
  {
    slug: "weeknight-dinners",
    icon: CookingPot,
    title: "Weeknight Dinners",
    photo: "/guides/home-kitchen-systems.webp",
    photoAlt:
      "Organized home kitchen workflow with prepared ingredients and a simmering pot",
    subtitle: "Real dinners on a weeknight, without a second job in the kitchen.",
    description:
      "A weeknight dinner has to survive a specific set of constraints: you are tired, it is later than you planned, and nobody wants to wash four pans. The recipes that work under those conditions are not simplified versions of weekend cooking — they are built differently, around one pan, short ingredient lists and steps that tolerate being slightly wrong.",
    description2:
      "The dishes collected here share that structure. Most finish in under forty-five minutes, most use a single pan or tray, and none of them punish you for walking away for five minutes to answer the door.",
    body: [
      "The single most useful weeknight habit is reading the recipe before you start. Not skimming it — reading it. Half of all weeknight stress comes from discovering at step four that something needed to marinate, or that two things need the oven at different temperatures.",
      "One-pan cooking earns its reputation, but only when the ingredients are chosen for compatible cooking times. Chicken thighs and potatoes work because both want forty minutes at high heat. Chicken breast and potatoes do not, because the breast is dry long before the potato is soft. When a one-pan recipe fails, timing mismatch is almost always why.",
      "Keep three or four dinners in permanent rotation and stop deciding. Decision fatigue at seven in the evening is the actual enemy, not cooking time. A curry, a pasta, a tray bake and something with eggs will cover most weeks, and each one absorbs whatever vegetables need using up.",
    ],
    features: [
      "One pan or one tray wherever possible",
      "Ingredients matched by cooking time, not by category",
      "Read the whole recipe before the first cut",
      "Three or four dinners in permanent rotation",
      "Recipes that tolerate a five-minute interruption",
      "Vegetables treated as flexible, not fixed",
    ],
    faq: [
      {
        q: "What counts as a realistic weeknight time budget?",
        a: "Forty-five minutes from walking into the kitchen to sitting down, including the time the oven is doing the work unattended. Anything that needs forty-five minutes of active attention is a weekend recipe wearing a weeknight label.",
      },
      {
        q: "How do I cook for one without wasting half the ingredients?",
        a: "Choose recipes built around pantry staples and one fresh item, rather than recipes needing six fresh things in small amounts. Eggs, tinned tomatoes, pasta and rice do not spoil while you decide.",
      },
      {
        q: "Can I prep weeknight dinners in advance?",
        a: "Prep the parts that take knife work — onions, garlic, carrots — at the weekend and keep them in the fridge. The cooking itself is rarely the slow part; the chopping is.",
      },
    ],
    related: [
      { slug: "one-pan-lemon-garlic-chicken", title: "One-Pan Lemon Garlic Chicken With Crushed Potatoes" },
      { slug: "weeknight-red-curry", title: "A Weeknight Red Curry That Does Not Taste Like a Jar" },
      { slug: "mise-en-place-read-the-recipe", title: "Read the Recipe First: The Case for Mise en Place" },
    ],
  },
  {
    slug: "budget-cooking",
    icon: PiggyBank,
    title: "Budget Cooking",
    photo: "/guides/budget-cooking.webp",
    photoAlt:
      "Affordable pantry staples and a balanced budget-friendly homemade meal",
    subtitle: "Spend less on groceries without spending less on flavour.",
    description:
      "Cooking cheaply is not the same as cooking badly, but the advice usually offered — buy own-brand, use coupons — barely moves the number. The larger savings come from structural changes: buying ingredients that stretch across several meals, cooking cuts that reward time instead of money, and throwing away less of what you already bought.",
    description2:
      "Household food waste is the quiet expense. A significant share of what most households buy is never eaten, which means a meaningful part of the grocery bill goes straight into the bin. Fixing that costs nothing and requires no sacrifice at all.",
    body: [
      "Build meals outward from cheap protein rather than inward from expensive protein. Dried lentils, chickpeas, eggs and chicken thighs cost a fraction of steak or fish per portion and take seasoning better. A well-made lentil ragù is not a compromise version of a beef one — it is a different dish that happens to be cheaper.",
      "Learn which expensive things are actually cheap per use. A jar of anchovies, a tub of miso, a bottle of soy sauce and a piece of parmesan all look costly on the shelf and then last for months, adding depth to dishes that would otherwise need meat. The pantry is where budget cooking is won.",
      "Shop your fridge before you shop the shop. Most households buy things they already own because nobody looked. One five-minute check before writing the list removes duplicates, surfaces what needs using and turns the week's cooking into a plan rather than a series of guesses.",
    ],
    features: [
      "Cheap protein as the starting point, not the substitute",
      "Pantry umami instead of expensive meat",
      "Whole vegetables over pre-cut and pre-washed",
      "Cuts that reward slow cooking rather than fast money",
      "Check the fridge before writing the shopping list",
      "Waste treated as the biggest single saving",
    ],
    faq: [
      {
        q: "Is buying in bulk always cheaper?",
        a: "Only for things you genuinely get through. Rice, dried pulses, oats and frozen vegetables reward bulk buying. Fresh produce and anything you buy because it was on offer usually does not — a bargain you throw away costs full price.",
      },
      {
        q: "Are frozen vegetables worse than fresh?",
        a: "No. They are frozen within hours of harvest, so nutritionally they are frequently better than fresh produce that spent a week in transit. They also do not rot while you decide what to cook, which is the real budget advantage.",
      },
      {
        q: "What is the single biggest saving available to most households?",
        a: "Eating what you already bought. Before changing where you shop or what you buy, spend two weeks using up what is in the fridge and freezer — most people find the bill drops without any change in what they eat.",
      },
    ],
    related: [
      { slug: "cut-grocery-bill", title: "Cutting Your Grocery Bill Without Eating Worse" },
      { slug: "build-a-pantry-that-cooks", title: "How to Build a Pantry That Cooks Dinner For You" },
      { slug: "crispy-chickpea-halloumi-bowl", title: "The Crispy Chickpea Bowl That Actually Stays Crispy" },
    ],
  },
  {
    slug: "kitchen-setup",
    icon: Utensils,
    title: "Kitchen Setup & Gear",
    photo: "/guides/kitchen-gear.webp",
    photoAlt:
      "Essential durable cookware and utensils arranged in a warm home kitchen",
    subtitle: "The short list of equipment that actually changes how you cook.",
    description:
      "Kitchen shops sell a great many objects that solve problems nobody has. A garlic press, an avocado slicer and an egg separator all replace something a knife or a hand does faster. Meanwhile the three tools that genuinely change your cooking — a sharp knife, a heavy pan and a set of scales — are often the ones people put off buying.",
    description2:
      "This guide is about the short list. Not the aspirational kitchen, but the six or seven items that do most of the work, plus how to arrange them so cooking stops feeling like an obstacle course.",
    body: [
      "One good knife beats a block of mediocre ones. A single chef's knife, kept sharp, handles almost every task in a home kitchen. Sharpness matters more than price: a cheap sharp knife is safer and faster than an expensive dull one, because a dull blade slides off what it should be cutting.",
      "Heavy pans hold heat, and holding heat is most of what browning requires. A thin pan drops in temperature the moment cold food touches it, so the food steams in its own moisture instead of searing. Cast iron or heavy stainless will outcook an expensive lightweight non-stick for anything you want a crust on.",
      "Scales change baking from a gamble into a repeatable process. A cup of flour can vary by a third depending on how it was scooped, which is why the same recipe produces a different result each time. Weighing removes that variable entirely, and costs less than one failed cake.",
      "Layout matters as much as equipment. Keep what you use daily within one step of where you use it, and get everything else out of the way. Most kitchen frustration is not missing tools — it is moving six objects to reach the seventh.",
    ],
    features: [
      "One chef's knife, kept genuinely sharp",
      "A heavy pan that holds its heat",
      "Digital scales for anything baked",
      "A board large enough to work on",
      "Tools stored within one step of where they are used",
      "Single-purpose gadgets avoided on principle",
    ],
    faq: [
      {
        q: "How much should I spend on a first chef's knife?",
        a: "Less than people expect. A mid-range knife you sharpen regularly outperforms a premium one you never maintain. Buy something comfortable in your hand and spend the difference on a sharpener.",
      },
      {
        q: "Is non-stick worth having?",
        a: "For eggs and delicate fish, yes. For searing and browning, no — non-stick coatings are not meant for the heat those need, and the pans are usually too light to hold temperature anyway. One small non-stick alongside one heavy pan covers both cases.",
      },
      {
        q: "What is the most overrated piece of kitchen equipment?",
        a: "Anything that does one job a knife already does. Garlic presses, herb strippers and egg slicers all take longer to wash than the task takes to do by hand.",
      },
    ],
    related: [
      { slug: "knife-skills-four-cuts", title: "Knife Skills: The Four Cuts That Cover Almost Every Recipe" },
      { slug: "build-a-pantry-that-cooks", title: "How to Build a Pantry That Cooks Dinner For You" },
      { slug: "no-knead-focaccia", title: "No-Knead Focaccia for People Who Do Not Bake" },
    ],
  },
  {
    slug: "cooking-mistakes",
    icon: Wrench,
    title: "Fixing Common Cooking Mistakes",
    photo: "/guides/recipe-troubleshooting.webp",
    photoAlt: "Cook reviewing recipe notes in a home kitchen",
    subtitle: "Why the dish went wrong, and what still saves it.",
    description:
      "Almost every kitchen failure belongs to a short list: too salty, too bland, too watery, burnt on the bottom, or split. What separates cooks who recover from cooks who start again is not talent — it is recognising which failure is happening early enough to act, and knowing that most of them have a fix.",
    description2:
      "This guide covers the diagnosis as much as the repair. A sauce that will not cling, a stew that tastes of nothing and a curdled cream sauce each have a specific cause, and treating the wrong cause usually makes things worse.",
    body: [
      "Bland is the most common complaint and the most misdiagnosed. It is usually not a lack of salt but a lack of acid. If a dish tastes flat after salting properly, a squeeze of lemon or a splash of vinegar will often do what more salt cannot — salt makes flavours louder, acid makes them distinct.",
      "Over-salting is harder to reverse than folklore suggests. A raw potato does not absorb meaningful salt. What actually works is dilution: more liquid, more unsalted bulk, or splitting the batch and building a second unsalted half to fold back in. Acid and fat also mask saltiness without removing it.",
      "Watery sauces are usually a heat problem, not a thickener problem. Reducing over higher heat concentrates flavour as it thickens, whereas cornflour thickens without adding anything. If the sauce is thin and tastes weak, reduce it. If it is thin and tastes right, thicken it.",
      "Burnt is the one failure with a hard limit. If the bottom has caught, move the food to a clean pan immediately without scraping — the scorched layer will carry through the whole dish if you stir it back in. Beyond a certain point, the bitterness is not recoverable, and knowing that saves an hour of hopeful seasoning.",
    ],
    features: [
      "Bland usually means missing acid, not missing salt",
      "Over-salting is fixed by dilution, not by potatoes",
      "Reduce a weak sauce; thicken a strong one",
      "Move burnt food to a clean pan without scraping",
      "Split sauces are rescued off the heat, slowly",
      "Taste at every stage, not only at the end",
    ],
    faq: [
      {
        q: "My food always tastes like it is missing something. What is it?",
        a: "Acid, most of the time. Restaurant food tastes brighter than home cooking largely because something sharp goes in at the end. Try a squeeze of lemon before reaching for more salt.",
      },
      {
        q: "Can I really save a split or curdled sauce?",
        a: "Often, yes. Take it off the heat, and whisk a spoonful of the split sauce into a little warm liquid — cream, stock or an egg yolk — then gradually add the rest back. Heat caused the split, so more heat will not undo it.",
      },
      {
        q: "How do I stop burning things on the bottom of the pan?",
        a: "Usually the heat is too high for the pan's weight. Thin pans develop hot spots; heavy pans spread heat. Lower the heat, stir the base rather than the surface, and deglaze early while the browning is still brown.",
      },
    ],
    related: [
      { slug: "rescue-a-dish", title: "Rescuing Dinner: Fixes for Salty, Bland, Watery and Burnt" },
      { slug: "how-to-salt-your-food", title: "How to Actually Salt Your Food" },
      { slug: "why-pasta-sauce-doesnt-stick", title: "Why Your Pasta Sauce Slides Off the Pasta" },
    ],
  },
  {
    slug: "30-minute-meals",
    icon: Timer,
    title: "Fast 30-Minute Meals",
    photo: "/guides/fast-weeknight-cooking.webp",
    photoAlt: "Fast dinner preparation workflow in a modern kitchen",
    subtitle: "Thirty minutes, start to plate, without cutting corners that matter.",
    description:
      "A thirty-minute meal is a scheduling problem more than a cooking problem. The cooking itself is rarely the bottleneck — waiting for water to boil, waiting for a pan to heat, and chopping while nothing else is happening is where the time goes. Cooks who are genuinely fast are simply doing several things at once.",
    description2:
      "The habit that saves the most time costs nothing: put the water on and the pan on the heat before you pick up a knife. Ten minutes of heating happens while you prep instead of after it.",
    body: [
      "Order the work by what takes longest to start. Oven on first, water on second, pan on third, then chop. Most home cooks do it in the opposite order — finish all the preparation, then start heating — and add fifteen unnecessary minutes to every meal.",
      "Choose ingredients that cook in the time you have. Thin cuts, small dice, and anything already tender will finish inside thirty minutes; a whole chicken breast, large potato chunks and dried beans will not. This is a selection problem, not a technique problem, and no amount of high heat solves it.",
      "Let the pantry do the slow work. Tinned tomatoes, coconut milk, miso, stock paste and cooked pulses all deliver depth that would otherwise need an hour of simmering. A curry that tastes like it cooked all afternoon is usually a curry that started from a good paste and finished in twenty minutes.",
    ],
    features: [
      "Heat first, chop second",
      "Thin cuts and small dice as a default",
      "Pantry ingredients standing in for long simmering",
      "One pan heating while another finishes",
      "Sauces built in the pan the protein cooked in",
      "Finish with something fresh or sharp off the heat",
    ],
    faq: [
      {
        q: "Does cooking fast mean cooking worse?",
        a: "Only if you rush the parts that need time. Browning cannot be hurried, but chopping, heating and cleaning can all be overlapped. Fast cooking is about removing dead time, not about turning the heat up.",
      },
      {
        q: "What should I always have in to make a thirty-minute meal possible?",
        a: "Eggs, a starch that cooks fast, tinned tomatoes, coconut milk, and something sharp — lemon, vinegar or pickles. With those, most fresh ingredients turn into dinner without a plan.",
      },
      {
        q: "Is a pressure cooker worth it for weeknights?",
        a: "For dried pulses and tough cuts, genuinely yes — it converts a two-hour braise into thirty minutes. For quick-cooking food it saves nothing, because the time goes into coming up to pressure instead.",
      },
    ],
    related: [
      { slug: "creamy-tomato-orzo", title: "Creamy Tomato Orzo That Cooks in Its Own Sauce" },
      { slug: "shakshuka-for-one", title: "Shakshuka for One, in Fifteen Minutes" },
      { slug: "weeknight-red-curry", title: "A Weeknight Red Curry That Does Not Taste Like a Jar" },
    ],
  },
  {
    slug: "menu-planning",
    icon: CalendarDays,
    title: "Weekly Menu Planning",
    photo: "/guides/menu-planning.webp",
    photoAlt: "Weekly menu planning board with recipe notes",
    subtitle: "A plan loose enough to survive an actual week.",
    description:
      "Rigid meal plans fail for a predictable reason: they assume every evening goes as expected. One late meeting, one tired Tuesday, and the whole schedule collapses — usually along with the ingredients bought for it. A plan that works has slack built into it from the start.",
    description2:
      "Planning five dinners and cooking three is not a failure of discipline; it is what a normal week looks like. The fix is to plan four and leave one night deliberately empty, so the plan bends instead of breaking.",
    body: [
      "Plan by ingredient overlap rather than by variety. If Monday's roast chicken becomes Wednesday's soup and Thursday's sandwich filling, you have bought one thing and cooked three meals. Planning seven unrelated dinners means seven sets of ingredients, most of them used once and half-wasted.",
      "Order the week by perishability. Cook fish and delicate greens early, roots and cabbage later, and put the freezer meal on the night you know will be difficult. This is the whole trick to not throwing food away, and it takes about a minute to apply.",
      "Write the plan where you will see it. A plan in your head is a plan you will renegotiate at six in the evening, when tiredness argues persuasively for takeaway. A note on the fridge removes the decision, which is the point — the value of planning is not the menu, it is not having to think.",
      "Keep a short list of meals you can make from the pantry with no shopping at all. Every week eventually produces one evening where nothing goes to plan, and having a default that requires no fresh ingredients is what keeps that evening from becoming a delivery order.",
    ],
    features: [
      "Plan four dinners, not seven",
      "One night deliberately left open",
      "Ingredients chosen to overlap across meals",
      "Perishable food cooked first, roots later",
      "The plan written where you will actually see it",
      "A no-shopping pantry meal held in reserve",
    ],
    faq: [
      {
        q: "How long should planning a week take?",
        a: "Ten minutes, once you have a rotation to draw from. If it takes an hour, you are choosing new recipes rather than planning — those are different activities, and only one of them needs doing weekly.",
      },
      {
        q: "Should I plan lunches too?",
        a: "Plan them as leftovers rather than as separate meals. Cooking extra at dinner costs almost nothing in time and removes the lunch decision entirely, which is where most planning effort is wasted.",
      },
      {
        q: "What do I do when the plan falls apart mid-week?",
        a: "Move meals rather than abandoning them. Anything planned for Tuesday that did not happen becomes Thursday, and the freezer meal moves up. The plan is an order, not a schedule.",
      },
    ],
    related: [
      { slug: "meal-prep-without-boredom", title: "Meal Prep Without Eating the Same Thing Five Days Running" },
      { slug: "cut-grocery-bill", title: "Cutting Your Grocery Bill Without Eating Worse" },
      { slug: "build-a-pantry-that-cooks", title: "How to Build a Pantry That Cooks Dinner For You" },
    ],
  },
  {
    slug: "cooking-techniques",
    icon: Sparkles,
    title: "Core Cooking Techniques",
    photo: "/guides/cooking-coaching.webp",
    photoAlt: "Home cook tracking recipe outcomes and improvements",
    subtitle: "The handful of techniques that quietly sit under every recipe.",
    description:
      "Recipes tell you what to do. Techniques tell you why it works, which is what lets you cook without one. Four or five ideas — seasoning, browning, heat control and knife work — sit underneath almost everything in a home kitchen, and understanding them turns a recipe from a set of instructions into something you can adjust.",
    description2:
      "None of this requires professional training. It requires knowing what salt does to food over time, why a dry surface browns and a wet one steams, and how to hold a knife so your hand stops getting tired.",
    body: [
      "Salt early and taste often. Salt added at the start penetrates and seasons throughout; salt added at the end sits on the surface and tastes sharper. Neither is wrong, but they do different things, and cooks who season only at the end are working with one tool instead of two.",
      "Browning needs a dry surface, enough heat and enough space. Wet food steams, crowded food steams, and a pan that lost its heat when the food went in steams as well. That is one mechanism behind three of the most common complaints about home cooking, and it is why patting meat dry before it hits the pan makes such a visible difference.",
      "Heat control is mostly about anticipating lag. A pan keeps rising in temperature after you turn the dial down and keeps cooking after you take it off. Moving a pan off the heat thirty seconds early is a technique in itself, and it is the difference between garlic that is golden and garlic that is bitter.",
      "Knife work is about repetition, not speed. Four cuts cover almost every recipe, and cutting to a consistent size matters more than cutting quickly — evenly sized pieces cook evenly, which removes the most common cause of a dish that is simultaneously raw and overdone.",
    ],
    features: [
      "Salt early for depth, late for sharpness",
      "Dry surface, hot pan, space between pieces",
      "Anticipate the pan's heat lag in both directions",
      "Even cuts before fast cuts",
      "Taste at every stage and adjust",
      "Understand the mechanism, then ignore the recipe",
    ],
    faq: [
      {
        q: "Which technique gives the biggest improvement for the least effort?",
        a: "Seasoning properly and tasting as you go. It costs nothing, requires no equipment, and fixes the complaint most home cooks have about their own food.",
      },
      {
        q: "Why does restaurant food taste different from mine?",
        a: "Higher heat, more salt, more fat, and something acidic at the end. Domestic hobs cannot match a restaurant range, but the seasoning and the finishing acid are entirely available at home.",
      },
      {
        q: "Do I need to learn technique if I only follow recipes?",
        a: "You can cook well from recipes alone. Technique is what lets you tell why one went wrong, substitute an ingredient you do not have, and eventually cook without looking anything up.",
      },
    ],
    related: [
      { slug: "maillard-reaction-explained", title: "The Maillard Reaction, Explained for People Who Just Want Better Steak" },
      { slug: "how-to-salt-your-food", title: "How to Actually Salt Your Food" },
      { slug: "knife-skills-four-cuts", title: "Knife Skills: The Four Cuts That Cover Almost Every Recipe" },
    ],
  },
];

export default function HizmetDetay() {
  const { slug } = useParams();
  const service = services.find((s) => s.slug === slug);

  const activeChipRef = useRef(null);
  const chipContainerRef = useRef(null);

  useEffect(() => {
    const container = chipContainerRef.current;
    const chip = activeChipRef.current;
    if (!container || !chip) return;
    container.scrollLeft =
      chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
  }, [slug]);

  if (!service) return <Navigate to="/guides" replace />;

  const Icon = service.icon;

  // Editorial guide, not a service offering: Article for the page itself, plus a
  // FAQPage for the questions rendered further down.
  const pageUrl = `${SITE_URL}/guides/${service.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: service.title,
        description: service.description,
        image: `${SITE_URL}${service.photo}`,
        url: pageUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        inLanguage: "en-US",
        author: { "@type": "Organization", name: "Pulse Recipe", url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: "Pulse Recipe",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/food/logo-mark.svg`,
          },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: service.faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <>
      <SEO
        title={service.title}
        description={`${service.subtitle} ${service.description}`.slice(0, 160)}
        image={`${SITE_URL}${service.photo}`}
        jsonLd={jsonLd}
      />
      <PageHeader
        title={service.title}
        parent={{ to: "/guides", label: "Guides" }}
      />

      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-24 z-40">
        <div
          ref={chipContainerRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
        >
          {services.map((s) => {
            const SIcon = s.icon;
            const active = s.slug === slug;
            return (
              <Link
                key={s.slug}
                ref={active ? activeChipRef : null}
                to={`/guides/${s.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-[#448834] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <SIcon size={12} />
                {s.title}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="py-8 lg:py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-7 items-start">
            <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#448834] px-5 py-4">
                  <p className="text-white font-bold text-sm">Our Guides</p>
                </div>
                <nav className="divide-y divide-gray-50">
                  {services.map((s) => {
                    const SIcon = s.icon;
                    const active = s.slug === slug;
                    return (
                      <Link
                        key={s.slug}
                        to={`/guides/${s.slug}`}
                        className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors group ${
                          active
                            ? "bg-[#448834]/8 text-[#448834] font-semibold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#448834]"
                        }`}
                      >
                        <SIcon
                          size={15}
                          className={
                            active
                              ? "text-[#448834]"
                              : "text-gray-400 group-hover:text-[#448834]"
                          }
                        />
                        <span className="flex-1 leading-snug">{s.title}</span>
                        {active && (
                          <ChevronRight size={13} className="text-[#448834]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

            </aside>

            <div className="flex-1 min-w-0">
              <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 lg:h-96 mb-6 shadow-md">
                <img
                  src={service.photo}
                  alt={service.photoAlt ?? service.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-1.5 bg-[#448834] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <Icon size={11} />
                    OUR GUIDES
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                    {service.subtitle}
                  </h1>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">
                  Pulse Recipe
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">
                  {service.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {service.description}
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {service.description2}
                </p>
                {service.body.map((paragraph) => (
                  <p key={paragraph} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              <AdSenseBlock
                placement="recipeDetail"
                className="mb-4 sm:mb-6 rounded-2xl border border-gray-100 bg-white p-3"
              />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">
                  Highlights
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <CheckCircle
                        size={16}
                        className="text-[#448834] shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 text-sm leading-relaxed">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">
                  Common Questions
                </h3>
                <div className="divide-y divide-gray-100">
                  {service.faq.map(({ q, a }) => (
                    <div key={q} className="py-4 first:pt-0 last:pb-0">
                      <p className="font-semibold text-gray-900 text-sm mb-2">
                        {q}
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">
                  Keep Reading
                </h3>
                <ul className="divide-y divide-gray-100">
                  {service.related.map((post) => (
                    <li key={post.slug}>
                      <Link
                        to={`/recipes/${post.slug}`}
                        className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0 group"
                      >
                        <ChevronRight
                          size={16}
                          className="text-[#448834] shrink-0 mt-0.5"
                        />
                        <span className="text-gray-700 text-sm leading-relaxed group-hover:text-[#448834] transition-colors">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
