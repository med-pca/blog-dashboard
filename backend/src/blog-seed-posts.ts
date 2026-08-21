// Editorial seed content for the Flavor Journal blog.
// Each entry is a complete, self-contained article: unique subject, its own
// structure, no shared boilerplate. Run with `npm run seed:blog` (idempotent —
// matched on slug, so re-running updates rather than duplicating).

export interface BlogSeedPost {
  title: string
  slug: string
  excerpt: string
  metaDescription: string
  coverImage: string
  publishedAt: string
  content: string
}

export const BLOG_SEED_POSTS: BlogSeedPost[] = [
  {
    title: 'One-Pan Lemon Garlic Chicken With Crushed Potatoes',
    slug: 'one-pan-lemon-garlic-chicken',
    excerpt:
      'Chicken thighs and par-boiled potatoes roast on the same tray, so the potatoes crisp in the chicken fat and the lemon turns jammy. One tray, one bowl to wash.',
    metaDescription:
      'One-pan lemon garlic chicken thighs with crushed potatoes. Crisp skin, jammy lemon, 45 minutes and a single roasting tray.',
    coverImage: '/food/covers/one-pan-chicken.svg',
    publishedAt: '2026-08-18',
    content: `<p>The promise of a one-pan dinner usually falls apart on the potatoes. They come out of the oven pale and waxy because they were raw when they went in, and by the time they are cooked the chicken has dried out. The fix is five minutes of boiling before anything meets the tray.</p>

<h2>Why par-boiling changes everything</h2>
<p>A raw potato is mostly sealed. Boiling it briefly gelatinises the starch at the surface and roughens the outside, so when you crush it lightly you create a landscape of edges. Edges are what crisp. A smooth potato wedge has almost none, which is why it browns in patches and stays soft in the middle.</p>
<p>Five to seven minutes in salted water is enough for small potatoes. You are not trying to cook them through — you are trying to give the outside something to work with.</p>

<h2>What you need</h2>
<ul>
<li>6 bone-in, skin-on chicken thighs</li>
<li>800 g small waxy potatoes, halved if larger than a walnut</li>
<li>1 whole lemon, thinly sliced, plus the juice of half another</li>
<li>1 head of garlic, cloves separated and left unpeeled</li>
<li>3 tbsp olive oil</li>
<li>1 tsp dried oregano</li>
<li>Salt and black pepper</li>
<li>A handful of parsley, roughly chopped, to finish</li>
</ul>

<h2>Method</h2>
<ol>
<li>Heat the oven to 220°C. Put the potatoes in cold salted water, bring to a boil, and cook for six minutes from boiling. Drain and let them steam dry in the colander for a couple of minutes — surface moisture is the enemy of crisp.</li>
<li>Salt the chicken thighs on both sides and leave them skin-side up while the potatoes cook. Even ten minutes of dry salting draws moisture out of the skin, which is exactly what you want.</li>
<li>Tip the potatoes onto a large roasting tray. Press each one gently with the base of a glass until it cracks open — not flattened, just split.</li>
<li>Add the garlic cloves and lemon slices, pour over the oil, scatter the oregano, and toss. Push everything to the edges to make room in the middle.</li>
<li>Pat the chicken skin dry with kitchen paper and lay the thighs skin-side up in the centre. Do not oil the skin; the fat under it will render out and dress the potatoes.</li>
<li>Roast for 35–40 minutes, until the skin is deep brown and the potatoes are crisp at the edges. Squeeze over the extra lemon juice, scatter the parsley, and let it sit for five minutes before serving.</li>
</ol>

<blockquote>If your tray is crowded, use two. Steam trapped between ingredients is the single most common reason a tray bake comes out beige.</blockquote>

<h2>The garlic trick</h2>
<p>Leaving the cloves in their skins means they roast rather than burn. After 40 minutes they turn soft and sweet, and you squeeze them out onto the potatoes at the table. Peeled cloves at 220°C would be bitter well before the chicken was done.</p>

<h2>Variations worth trying</h2>
<ul>
<li><strong>Add a green thing halfway.</strong> Tenderstem broccoli or green beans tossed in at the 25-minute mark will roast without turning grey.</li>
<li><strong>Swap the herb.</strong> Rosemary is more assertive than oregano and stands up better if you are also adding olives.</li>
<li><strong>Use chicken breast if you must</strong>, but reduce the time to 25 minutes and give the potatoes a 12-minute head start alone in the oven.</li>
</ul>

<h2>Leftovers</h2>
<p>The potatoes will soften overnight — that is unavoidable. Reheat them in a dry frying pan rather than the microwave and they will re-crisp surprisingly well. The chicken is good cold, shredded into a sandwich with the roasted garlic mashed into mayonnaise.</p>`,
  },
  {
    title: 'Shakshuka for One, in Fifteen Minutes',
    slug: 'shakshuka-for-one',
    excerpt:
      'Most shakshuka recipes serve four and take an hour. This one is scaled for a single small pan and a single hungry person, and it is on the table in fifteen minutes.',
    metaDescription:
      'A fifteen-minute shakshuka scaled for one person. Tinned tomatoes, two eggs, one small pan — a proper breakfast without the batch cooking.',
    coverImage: '/food/covers/shakshuka.svg',
    publishedAt: '2026-08-14',
    content: `<p>Shakshuka has a reputation as a weekend dish, mostly because the recipes assume you are feeding a table. Scaled down to one pan and two eggs, it becomes a weekday breakfast that takes less time than queuing for a coffee.</p>

<h2>The fifteen-minute version</h2>
<p>The time saving comes from three decisions: a small pan, tinned tomatoes rather than fresh, and accepting that the sauce will be looser than a slow-simmered one. That looseness is not a flaw. It means more sauce to mop up with bread.</p>

<h2>What you need</h2>
<ul>
<li>1 tbsp olive oil</li>
<li>Half a small onion, sliced thinly</li>
<li>1 garlic clove, sliced</li>
<li>Half a red pepper, cut into strips</li>
<li>1 tsp sweet paprika</li>
<li>A quarter teaspoon of ground cumin</li>
<li>Half a 400 g tin of chopped tomatoes</li>
<li>2 eggs</li>
<li>Salt, pepper, and a pinch of sugar if the tomatoes are sharp</li>
<li>Bread, for eating it with — this is not optional</li>
</ul>

<h2>Method</h2>
<ol>
<li>Heat the oil in a small frying pan over a medium heat. Add the onion and pepper with a pinch of salt and cook for four minutes, stirring now and then, until they have softened at the edges.</li>
<li>Add the garlic, paprika and cumin and stir for thirty seconds. Spices need fat and heat to release their flavour, but they burn quickly — thirty seconds, then liquid.</li>
<li>Tip in the tomatoes, season, and simmer for five minutes until the sauce has thickened enough that a spoon dragged through it leaves a brief trail.</li>
<li>Make two wells with the back of the spoon and crack an egg into each. Season the eggs.</li>
<li>Cover the pan — a plate works if you have no lid — and cook for four to five minutes, until the whites are set and the yolks still move when you shake the pan.</li>
</ol>

<h2>Getting the eggs right</h2>
<p>This is where shakshuka is usually lost. The sauce is hot, the pan is hot, and the eggs go from raw to chalky in about ninety seconds. Three things help:</p>
<ul>
<li><strong>Lower the heat before the eggs go in.</strong> The residual heat in the sauce does most of the work.</li>
<li><strong>Cover the pan.</strong> Trapped steam sets the tops of the whites without you having to overcook the bottoms.</li>
<li><strong>Take it off early.</strong> The pan keeps cooking for a minute after it leaves the hob. If the whites look barely set, they are ready.</li>
</ul>

<blockquote>An egg with a set white and a liquid yolk sits in a window of roughly sixty seconds. Stand near the pan.</blockquote>

<h2>Things that make it better</h2>
<ul>
<li><strong>Feta,</strong> crumbled over in the last minute so it warms without melting into the sauce.</li>
<li><strong>A spoon of harissa</strong> stirred in with the tomatoes, if you want heat rather than just warmth.</li>
<li><strong>Herbs at the end.</strong> Parsley, coriander or dill — whatever is in the fridge. Added off the heat so they stay green.</li>
<li><strong>Yoghurt,</strong> a cold spoonful on the side. The contrast does more for the dish than another spice would.</li>
</ul>

<h2>The other half of the tin</h2>
<p>Half a tin of tomatoes is an awkward quantity, which is why people avoid recipes that call for it. Decant the rest into a jar; it keeps for four days in the fridge and makes a fast pasta sauce, or the base for the same dish again on Thursday.</p>`,
  },
  {
    title: 'Creamy Tomato Orzo That Cooks in Its Own Sauce',
    slug: 'creamy-tomato-orzo',
    excerpt:
      'Orzo cooked risotto-style in one pot, so the starch it releases thickens the sauce. No draining, no cream, and the whole thing takes twenty-five minutes.',
    metaDescription:
      'One-pot creamy tomato orzo with spinach. Cooked risotto-style so the pasta starch makes the sauce — no cream, no colander, 25 minutes.',
    coverImage: '/food/covers/tomato-orzo.svg',
    publishedAt: '2026-08-10',
    content: `<p>Orzo looks like rice and behaves like pasta, and that combination makes it the most useful shape in the cupboard for one-pot cooking. Cooked directly in its liquid rather than boiled and drained, it releases starch into the sauce and thickens it — the same mechanism that makes risotto creamy, with none of the stirring.</p>

<h2>Why this works without cream</h2>
<p>When you boil pasta and pour the water down the sink, you are throwing away the starch. Cook the pasta in just enough liquid for it to absorb, and that starch stays in the pan, where it binds the fat and the liquid into something glossy. The word "creamy" here describes a texture, not an ingredient.</p>
<p>This is also why the quantity of liquid matters more than usual. Too much and you have soup. Too little and the orzo catches on the base before it is cooked.</p>

<h2>What you need</h2>
<ul>
<li>1 tbsp olive oil and a knob of butter</li>
<li>1 small onion, finely diced</li>
<li>2 garlic cloves, finely chopped</li>
<li>2 tbsp tomato purée</li>
<li>300 g orzo</li>
<li>1 x 400 g tin of chopped tomatoes</li>
<li>600 ml hot vegetable or chicken stock</li>
<li>150 g spinach</li>
<li>40 g parmesan or a hard cheese, finely grated, plus more to serve</li>
<li>Salt, pepper, a pinch of chilli flakes</li>
</ul>

<h2>Method</h2>
<ol>
<li>Melt the butter into the oil in a wide, shallow pan over a medium heat. Cook the onion gently for six to eight minutes until soft and translucent. Do not rush this — browned onion makes a different, harsher dish.</li>
<li>Add the garlic and chilli flakes for one minute, then the tomato purée. Fry the purée for two minutes, stirring constantly. It will darken from bright red to brick and stop smelling raw. This step is the difference between a sauce that tastes finished and one that tastes like it needs another twenty minutes.</li>
<li>Stir in the orzo and coat it in the paste. Add the tinned tomatoes and about two thirds of the stock. Season.</li>
<li>Simmer uncovered for 10–12 minutes, stirring every couple of minutes so it does not stick. Add more stock whenever the surface looks dry — you want it loose, like a thick soup, right up until the end.</li>
<li>When the orzo is just tender, stir in the spinach a handful at a time. It collapses in under a minute.</li>
<li>Off the heat, beat in the cheese. Let it sit for two minutes, then taste and adjust the salt. Serve with more cheese and a hard grind of pepper.</li>
</ol>

<blockquote>Take it off the heat when the orzo still has the faintest bite. It carries on absorbing liquid in the pan and will be perfect by the time it reaches the table.</blockquote>

<h2>Common problems</h2>
<ul>
<li><strong>It went gluey.</strong> Too little liquid, or it sat too long before serving. Loosen with a splash of hot stock and stir.</li>
<li><strong>It caught on the bottom.</strong> A thin-based pan and not enough stirring. Do not scrape the burnt layer up into the sauce — decant everything above it into a clean pan instead.</li>
<li><strong>It tastes flat.</strong> Almost always salt, occasionally acid. A squeeze of lemon at the end lifts the whole thing.</li>
</ul>

<h2>Making it a different dinner</h2>
<p>The method survives a lot of substitution. Swap the spinach for chard or peas, add a tin of drained white beans with the stock, or stir through torn mozzarella instead of parmesan at the end. Roasted red peppers blitzed into the tinned tomatoes make it sweeter and rounder.</p>`,
  },
  {
    title: 'The Crispy Chickpea Bowl That Actually Stays Crispy',
    slug: 'crispy-chickpea-halloumi-bowl',
    excerpt:
      'Grain bowls go soggy because everything is assembled hot and dressed at once. A few small changes to the order of operations keeps the crunch until the last bite.',
    metaDescription:
      'A crispy chickpea and halloumi grain bowl with lemon tahini. The assembly order that stops grain bowls going soggy.',
    coverImage: '/food/covers/grain-bowl.svg',
    publishedAt: '2026-08-05',
    content: `<p>The grain bowl is a good idea that usually arrives at the table already failing. You roast something until it is crisp, pile it onto warm grains, spoon over a dressing, and within four minutes the crisp thing has surrendered. The recipe is rarely the problem. The order is.</p>

<h2>Three rules for a bowl that holds up</h2>
<ol>
<li><strong>Cool the grains.</strong> Warm grains steam. Steam softens everything above them. Spread the cooked grains on a plate for five minutes before building.</li>
<li><strong>Dress the base, not the top.</strong> Toss the grains and the raw vegetables in the dressing first, then add the crisp elements on top, undressed.</li>
<li><strong>Crisp things go on last, at the table.</strong> Not in the fridge, not in the packed lunch box. Carry them separately if you are taking this to work.</li>
</ol>

<h2>What you need</h2>
<p><strong>For the bowl</strong></p>
<ul>
<li>1 x 400 g tin of chickpeas, drained and rinsed</li>
<li>225 g halloumi, cut into 1 cm slices</li>
<li>200 g pearl barley, farro or brown rice</li>
<li>1 tsp smoked paprika, half a teaspoon of ground coriander</li>
<li>2 tbsp olive oil</li>
<li>Half a cucumber, diced; a large handful of cherry tomatoes, halved</li>
<li>Red onion, sliced very thinly</li>
<li>Parsley and mint, roughly chopped</li>
</ul>
<p><strong>For the lemon tahini</strong></p>
<ul>
<li>3 tbsp tahini, juice of 1 lemon, 1 small garlic clove grated, 4–6 tbsp cold water, salt</li>
</ul>

<h2>Method</h2>
<ol>
<li>Cook the grains in well-salted water according to the packet, then drain and spread them out to cool.</li>
<li>Heat the oven to 200°C. Dry the chickpeas thoroughly on a tea towel — genuinely dry, rolling them around until the skins look dull. Wet chickpeas steam and never crisp.</li>
<li>Toss them with the oil, paprika, coriander and salt, spread on a tray in a single layer, and roast for 25–30 minutes, shaking twice. They are ready when they rattle.</li>
<li>Make the dressing: whisk the tahini with the lemon juice and garlic. It will seize into a thick paste — this is normal and alarming the first time. Add cold water a tablespoon at a time, whisking, until it loosens into a pourable cream. Season.</li>
<li>Fry the halloumi in a dry non-stick pan over a medium-high heat, two to three minutes a side, until deeply golden. Do not move it while it colours.</li>
<li>Toss the cooled grains with the cucumber, tomatoes, onion, herbs and most of the dressing. Divide between bowls, then top with the halloumi and chickpeas and spoon over the rest.</li>
</ol>

<blockquote>Tahini seizing when it meets lemon juice is the emulsion breaking and reforming. Keep whisking and adding water — it always comes back.</blockquote>

<h2>On halloumi</h2>
<p>Halloumi squeaks when it is underdone and turns rubbery when it is overdone, and the window between the two is wider than people think — the mistake is usually pan temperature, not timing. Medium-high, dry pan, and leave it alone. It releases enough of its own fat.</p>
<p>If you are cooking it ahead, know that it firms up considerably as it cools and does not soften again. Halloumi is a cook-and-serve ingredient.</p>

<h2>Building it for lunch tomorrow</h2>
<p>This bowl packs well if you keep it in parts: dressed grains and vegetables in the container, chickpeas in a small bag, halloumi fried fresh or eaten cold. The dressing thickens overnight in the fridge — loosen it with a splash of water before using.</p>`,
  },
  {
    title: 'Slow-Braised Beef Ragù Worth Making on a Sunday',
    slug: 'slow-braised-beef-ragu',
    excerpt:
      'Three hours of almost no work. The technique matters more than the ingredients: brown properly, deglaze thoroughly, and keep the pot barely bubbling.',
    metaDescription:
      'A slow-braised beef ragù for pasta. Why browning, deglazing and a barely-simmering pot matter more than the ingredient list.',
    coverImage: '/food/covers/beef-ragu.svg',
    publishedAt: '2026-07-31',
    content: `<p>A ragù is not a difficult dish, but it is an unforgiving one. There are only a handful of ingredients and nowhere for a mistake to hide. Almost everything that separates a memorable one from a flat one happens in the first twenty minutes and the last ten.</p>

<h2>The cut matters more than the mince</h2>
<p>Minced beef makes a fast ragù. A braised one wants a whole cut with connective tissue in it — beef shin, chuck or brisket. That connective tissue is collagen, and over three hours of gentle heat it dissolves into gelatine, which is what gives a good ragù its lip-coating body. Lean mince has almost none of it, which is why it can taste correct and still feel thin.</p>

<h2>What you need</h2>
<ul>
<li>1.2 kg beef shin or chuck, in large chunks</li>
<li>2 tbsp olive oil</li>
<li>1 onion, 1 carrot, 1 celery stick — all finely diced</li>
<li>3 garlic cloves, chopped</li>
<li>2 tbsp tomato purée</li>
<li>250 ml red wine</li>
<li>1 x 400 g tin of whole plum tomatoes, crushed by hand</li>
<li>400 ml beef stock</li>
<li>1 bay leaf, a sprig of rosemary, a parmesan rind if you have one</li>
<li>Salt and pepper</li>
</ul>

<h2>Method</h2>
<ol>
<li>Dry the beef and salt it well. Heat the oil in a heavy casserole over a high heat and brown the chunks in batches — properly brown, four or five minutes a side, not grey. Crowding the pan is the single most common failure here: the meat releases water, the temperature drops, and it steams instead of searing. Set the browned meat aside.</li>
<li>Turn the heat down to medium. Add the onion, carrot and celery with a pinch of salt and cook for ten to twelve minutes until soft and sweet. They should take on colour from the fond — the brown residue on the base — without burning.</li>
<li>Add the garlic and the tomato purée and fry for two minutes until the purée darkens.</li>
<li>Pour in the wine and turn the heat up. Scrape the base of the pot hard with a wooden spoon while it bubbles. Everything stuck there is flavour, and this is your only chance to get it into the sauce. Let the wine reduce by half.</li>
<li>Return the beef and any juices. Add the tomatoes, stock, herbs and parmesan rind. The liquid should come about three quarters of the way up the meat, no higher.</li>
<li>Bring it to a bare simmer, cover with the lid slightly ajar, and cook at the lowest heat that keeps it moving — or in a 150°C oven — for three hours. You want a bubble every few seconds, not a rolling boil.</li>
<li>Lift the meat out and shred it with two forks, discarding any gristle. If the sauce looks thin, reduce it uncovered for ten minutes. Return the meat, taste hard for salt, and finish with a splash of good olive oil.</li>
</ol>

<blockquote>A hard boil tightens muscle fibres and squeezes moisture out. A bare simmer lets collagen melt while the meat stays tender. The difference is entirely in the heat.</blockquote>

<h2>Serving it</h2>
<p>Use a shape with texture — pappardelle, rigatoni, or anything with ridges. Cook the pasta a minute short, then finish it in the pan with the ragù and a ladle of pasta water for a minute, tossing hard. The sauce should cling, not sit in a pool underneath.</p>

<h2>It is better tomorrow</h2>
<p>This is not a cliché in this case. Overnight in the fridge, the fat solidifies on top and can be lifted off or stirred back in, and the flavours settle into each other. It freezes for three months. Make double — the second batch costs you almost no additional work.</p>`,
  },
  {
    title: 'Overnight Oats, Five Ways, Without the Sad Jar',
    slug: 'overnight-oats-five-ways',
    excerpt:
      'The base ratio that stops overnight oats turning to wallpaper paste, plus five combinations that taste like they were made that morning.',
    metaDescription:
      'The correct oat-to-liquid ratio for overnight oats, plus five flavour combinations. How to prep five breakfasts in ten minutes.',
    coverImage: '/food/covers/overnight-oats.svg',
    publishedAt: '2026-07-26',
    content: `<p>Overnight oats have a bad reputation among people who have only had bad ones. The bad ones are almost always the same mistake: too little liquid, mixed the night before and left to compact into a solid grey brick. The ratio is the whole recipe.</p>

<h2>The ratio</h2>
<p><strong>One part rolled oats to one and a quarter parts liquid, by volume.</strong> Not one to one. Oats keep absorbing for hours, and a mix that looks correct at midnight will be dry by seven. If you like it looser, go to one and a half.</p>
<p>Use rolled oats, not instant and not steel-cut. Instant oats collapse into powder. Steel-cut oats will not soften enough overnight and stay unpleasantly hard.</p>

<h2>The base</h2>
<ul>
<li>50 g rolled oats (about 6 tbsp)</li>
<li>125 ml milk of any kind</li>
<li>2 tbsp yoghurt</li>
<li>A pinch of salt</li>
<li>1 tsp honey, maple syrup or nothing at all</li>
</ul>
<p>The salt is not optional. Without it, oats taste of wet cardboard no matter how much fruit you add. The yoghurt is technically optional but it adds acidity and body, and it is the reason a good jar tastes like a dessert rather than a punishment.</p>

<h2>Five combinations</h2>
<h3>1. Apple and cinnamon</h3>
<p>Half a grated apple stirred through the base with a quarter teaspoon of cinnamon. The apple releases liquid overnight, so drop the milk to 110 ml. Top with toasted walnuts in the morning.</p>

<h3>2. Peanut butter and banana</h3>
<p>One heaped tablespoon of peanut butter whisked into the milk before it meets the oats — it will not incorporate afterwards. Sliced banana added in the morning, not the night before, unless you like it brown.</p>

<h3>3. Lemon, blueberry and vanilla</h3>
<p>Zest of half a lemon, a quarter teaspoon of vanilla, and a handful of frozen blueberries stirred in frozen. They thaw overnight and bleed just enough colour into the oats.</p>

<h3>4. Coffee and cocoa</h3>
<p>Replace 50 ml of the milk with cold espresso and whisk in a teaspoon of cocoa powder. Sweeten a little more than usual — cocoa is bitter and coffee is bitter, and the oats will not carry both unsweetened.</p>

<h3>5. Tahini, date and orange</h3>
<p>A tablespoon of tahini, two chopped dates, and the zest of half an orange. The least obvious of the five and the one people ask about.</p>

<blockquote>Add anything crunchy in the morning. Nuts, granola and seeds all go soft overnight, and a jar with no texture contrast is why people give up on this breakfast.</blockquote>

<h2>Prepping five at once</h2>
<p>Line up five jars, put the dry base in all of them, then add the liquid and the flavourings. Ten minutes on a Sunday evening. They keep for four days in the fridge — by day five the texture is noticeably worse, so five jars is optimistic for a five-day week. Make three and cook eggs on the other days.</p>

<h2>If you forgot to make them</h2>
<p>Oats will soften acceptably in about twenty minutes at room temperature, or ten in the microwave and fridge cycle if you are desperate. It is not the same, but it is a great deal better than nothing.</p>`,
  },
  {
    title: 'Miso Butter Roasted Carrots',
    slug: 'miso-butter-roasted-carrots',
    excerpt:
      'A side dish with three ingredients that people consistently ask about. The miso browns alongside the carrot sugars and produces something far bigger than the effort involved.',
    metaDescription:
      'Miso butter roasted carrots — a three-ingredient side dish. Why miso and roasting temperature work together, and how not to burn it.',
    coverImage: '/food/covers/miso-carrots.svg',
    publishedAt: '2026-07-21',
    content: `<p>Some recipes are worth writing down not because they are complicated but because the combination is not obvious. Miso and carrot is one of those. The carrot brings sugar, the miso brings salt and glutamate, and roasting pushes both of them somewhere neither goes alone.</p>

<h2>Why it works</h2>
<p>Carrots are among the sweetest common vegetables, and roasting concentrates that sweetness as water evaporates. Sweetness alone gets boring quickly, which is why roasted carrots are usually a forgettable side.</p>
<p>Miso is fermented soybean paste — intensely salty, faintly funky, and loaded with glutamates that read on the palate as savoury depth. Put it on a sweet vegetable and you get the same contrast that makes salted caramel work, with an extra savoury dimension on top.</p>

<h2>What you need</h2>
<ul>
<li>800 g carrots, scrubbed, halved lengthways if thick</li>
<li>50 g butter, softened</li>
<li>2 tbsp white or yellow miso paste</li>
<li>1 tbsp honey or maple syrup (optional)</li>
<li>Black pepper</li>
<li>Sesame seeds and sliced spring onion, to finish</li>
</ul>
<p>Use white (shiro) or yellow miso. Red miso is much stronger and will dominate; if it is all you have, use one tablespoon rather than two.</p>

<h2>Method</h2>
<ol>
<li>Heat the oven to 200°C. Mash the butter, miso and honey together into a smooth paste. It should look like a soft, beige compound butter.</li>
<li>Toss the carrots with about two thirds of the paste until every surface is coated. Spread them on a tray in a single layer with space between them.</li>
<li>Roast for 20 minutes, then turn them and dot over the remaining paste. Roast for another 12–18 minutes, until the edges are deeply caramelised and a knife slides in with no resistance.</li>
<li>Finish with sesame seeds, spring onion and a good grind of black pepper. No extra salt — the miso has it covered.</li>
</ol>

<blockquote>Miso contains sugars and proteins and it will burn well before the carrots are cooked at high heat. 200°C is the ceiling. If your oven runs hot, drop to 190°C and add ten minutes.</blockquote>

<h2>Getting the caramelisation right</h2>
<p>Space is the variable people ignore. Carrots crowded onto a small tray release steam that has nowhere to go, and steamed carrots do not brown no matter how long you leave them. If they do not fit in one layer with gaps, use two trays. It is the same amount of washing up as scraping a failed one.</p>

<h2>What to do with the leftover paste</h2>
<p>Miso butter keeps for two weeks in the fridge and is useful well beyond carrots:</p>
<ul>
<li>Melted over sweetcorn on the cob</li>
<li>Stirred into hot noodles with a splash of the cooking water</li>
<li>Under the skin of a chicken before roasting</li>
<li>On toast, with a fried egg, which sounds odd and is not</li>
</ul>

<h2>The same idea, other vegetables</h2>
<p>Anything sweet and roastable takes the treatment: parsnips, sweet potato, squash, whole spring onions. Sprouts work well too, though they need a shorter roast and a lighter hand with the paste.</p>`,
  },
  {
    title: 'A Weeknight Red Curry That Does Not Taste Like a Jar',
    slug: 'weeknight-red-curry',
    excerpt:
      'Shop-bought curry paste is a perfectly good starting point. Three techniques turn it from flat and sweet into something that tastes like it took much longer.',
    metaDescription:
      'How to make a shop-bought Thai red curry paste taste homemade: frying the paste, cracking the coconut cream, and balancing at the end.',
    coverImage: '/food/covers/red-curry.svg',
    publishedAt: '2026-07-16',
    content: `<p>There is no shame in shop-bought curry paste. Pounding one from scratch is a genuinely good way to spend an hour, and most weeknights do not have that hour in them. What lets a jarred paste down is not the paste — it is what gets done to it, which is usually nothing.</p>

<h2>Three techniques that change everything</h2>

<h3>1. Fry the paste properly</h3>
<p>Most people tip the paste into liquid. Instead, fry it in oil for two to three minutes first, over a medium heat, stirring constantly. The aromatics in the paste are fat-soluble — they need oil and heat to release, and boiling them in coconut milk simply will not do it. You will smell the change: sharp and raw at first, then rounded and fragrant.</p>

<h3>2. Crack the coconut cream</h3>
<p>Open a tin of full-fat coconut milk without shaking it. Spoon the thick cream off the top into the pan with the paste and let it bubble for three or four minutes until the fat separates out and pools around the edges — it will look split, and that is exactly right. Frying the paste in that coconut fat is a traditional step and the single biggest upgrade available.</p>
<p>This does not work with light coconut milk, which is emulsified and stabilised. Buy the full-fat tin.</p>

<h3>3. Balance at the end, not the beginning</h3>
<p>Thai cooking balances salty, sweet, sour and hot. Jarred pastes are usually short on all four because they are formulated to be inoffensive. Fix it in the last minute with fish sauce, palm or brown sugar, and lime juice — tasting between each addition.</p>

<h2>What you need</h2>
<ul>
<li>3 tbsp red curry paste</li>
<li>1 tbsp neutral oil</li>
<li>1 x 400 ml tin of full-fat coconut milk, unshaken</li>
<li>400 g mixed vegetables — aubergine, red pepper, green beans, bamboo shoots</li>
<li>200 ml stock or water</li>
<li>1–2 tbsp fish sauce (or light soy for a vegetarian version)</li>
<li>1–2 tsp brown sugar</li>
<li>Juice of half a lime</li>
<li>Thai basil or coriander, and a sliced red chilli</li>
</ul>

<h2>Method</h2>
<ol>
<li>Heat the oil in a wide pan. Spoon in the thick coconut cream from the top of the tin and let it bubble for three minutes until it separates.</li>
<li>Add the paste and fry for two to three minutes, stirring, until it darkens and smells fragrant.</li>
<li>Add the firmest vegetables first — aubergine, carrot — and turn them in the paste for two minutes. Pour in the rest of the coconut milk and the stock.</li>
<li>Simmer for eight to ten minutes, adding quicker vegetables like peppers and beans partway through so nothing turns to mush.</li>
<li>Take it off the heat. Add fish sauce, sugar and lime a little at a time, tasting after each. Stop when it tastes bright rather than flat.</li>
<li>Stir through the herbs and serve with jasmine rice.</li>
</ol>

<blockquote>If it tastes dull, it is nearly always missing acid or salt, not spice. Add lime before you add more paste.</blockquote>

<h2>Adding protein</h2>
<p>Chicken thigh, sliced, goes in with the firm vegetables and needs about eight minutes. Prawns need three and should go in at the end. Firm tofu is best fried separately until golden and folded through at the last moment, or it will disintegrate.</p>`,
  },
  {
    title: 'No-Knead Focaccia for People Who Do Not Bake',
    slug: 'no-knead-focaccia',
    excerpt:
      'No kneading, no stand mixer, no shaping skill required. A long cold rise does the work, and the dough is more forgiving than almost any other bread.',
    metaDescription:
      'A no-knead focaccia recipe using a long cold fermentation. No mixer, no kneading, and a dough that tolerates being handled badly.',
    coverImage: '/food/covers/focaccia.svg',
    publishedAt: '2026-07-10',
    content: `<p>Focaccia is the right bread for a first attempt. It is supposed to be irregular, it is supposed to be dimpled and rustic, and a wet dough left alone in the fridge does nearly all of the work that kneading would otherwise do.</p>

<h2>Why no kneading is needed</h2>
<p>Kneading develops gluten by physically aligning proteins. Time does the same thing on its own — given enough hours, the proteins in a wet dough find each other without help. The technical name is autolysis, and the practical version is: mix it badly, wait a day, and the dough will have organised itself.</p>
<p>The cold also slows the yeast, which lets flavour compounds develop that a fast two-hour rise never produces. This is why an overnight focaccia tastes of something and a rushed one tastes of nothing.</p>

<h2>What you need</h2>
<ul>
<li>500 g strong white bread flour</li>
<li>400 ml lukewarm water (80% hydration — the dough will be sticky and that is correct)</li>
<li>10 g fine salt</li>
<li>5 g instant dried yeast</li>
<li>Olive oil, generously — at least 6 tbsp across the process</li>
<li>Flaky salt and rosemary, to finish</li>
</ul>

<h2>Method</h2>
<ol>
<li><strong>Day one, five minutes.</strong> Whisk the yeast and salt into the flour. Add the water and mix with a spoon or a wet hand until no dry flour remains. It will be a shaggy, unpromising mess. Do not knead it.</li>
<li>Pour a tablespoon of oil over the top, cover the bowl, and refrigerate for 12–24 hours. If you can, fold the dough over itself a few times after the first hour — reach under one side, stretch it up, fold it over. Four folds, one minute. It is optional but it improves the crumb.</li>
<li><strong>Day two.</strong> Pour three tablespoons of oil into a 20 x 30 cm tin and spread it over the base and sides. Tip the dough in and turn it once to coat.</li>
<li>Leave it at room temperature for two to four hours, until it has relaxed to fill the tin and looks puffy and bubbled. Cold dough takes longer — do not rush this on the clock.</li>
<li>Heat the oven to 220°C. Oil your fingers and press straight down through the dough to the base of the tin, all over, making deep dimples. Be firmer than feels polite.</li>
<li>Drizzle over more oil so it pools in the dimples, scatter flaky salt and rosemary, and bake for 22–28 minutes until deep golden.</li>
<li>Lift it out of the tin onto a rack immediately. Left in the tin it steams and the base goes soft.</li>
</ol>

<blockquote>The dimples are structural, not decorative. They stop the bread doming and create the pockets that hold the oil.</blockquote>

<h2>Where it usually goes wrong</h2>
<ul>
<li><strong>Adding flour because the dough is sticky.</strong> The stickiness is the recipe. Wet hands, not floured ones.</li>
<li><strong>Baking it cold.</strong> Straight from the fridge into the oven gives a dense, flat result. It needs the second rise at room temperature.</li>
<li><strong>Being shy with the oil.</strong> Focaccia is a bread enriched from the outside in. Under-oiled focaccia is just flatbread.</li>
</ul>

<h2>Toppings</h2>
<p>Halved cherry tomatoes pressed into the dimples, thin slices of potato and rosemary, olives, or red onion and thyme. Add anything watery in the last ten minutes rather than at the start.</p>`,
  },
  {
    title: 'Brown Butter Banana Bread',
    slug: 'brown-butter-banana-bread',
    excerpt:
      'Five extra minutes at the hob turns ordinary banana bread into something nuttier and less one-note. Plus the truth about how black those bananas need to be.',
    metaDescription:
      'Brown butter banana bread. How browning the butter changes the flavour, and how ripe bananas really need to be.',
    coverImage: '/food/covers/banana-bread.svg',
    publishedAt: '2026-07-04',
    content: `<p>Banana bread is forgiving enough that almost any recipe produces something edible, which is why there are ten thousand of them and most taste the same. Browning the butter is the one change that makes a noticeable difference for very little effort.</p>

<h2>What browning butter actually does</h2>
<p>Butter is roughly 80% fat, 16% water and 4% milk solids. Heat it and the water boils off; keep heating and the milk solids toast, going from white to gold to brown and producing nutty, caramel-like compounds that were not there before.</p>
<p>The trade-off is that you lose the water, which means slightly less steam in the bake and a marginally denser crumb. In banana bread — already dense and moist from the fruit — that is not a problem.</p>

<h2>How ripe is ripe enough</h2>
<p>Yellow bananas with a few brown flecks are not ripe enough. You want them heavily spotted to mostly black, soft enough to mash with a fork without effort. As bananas ripen, starch converts to sugar; an underripe banana is starchy and bland and no amount of sugar in the batter compensates.</p>
<p>If yours are stubbornly yellow, bake them in their skins at 150°C for 15–20 minutes until the skins blacken. It is not identical to natural ripening but it is close, and it works.</p>

<h2>What you need</h2>
<ul>
<li>115 g unsalted butter</li>
<li>3 large very ripe bananas (about 350 g peeled)</li>
<li>150 g light brown sugar</li>
<li>2 eggs</li>
<li>1 tsp vanilla extract</li>
<li>200 g plain flour</li>
<li>1 tsp bicarbonate of soda</li>
<li>Half a teaspoon of fine salt</li>
<li>Half a teaspoon of cinnamon (optional)</li>
<li>100 g dark chocolate or toasted walnuts (optional)</li>
</ul>

<h2>Method</h2>
<ol>
<li>Melt the butter in a light-coloured pan over a medium heat — you need to see the colour. It will foam, then quiet down, then the solids at the base will turn golden brown and it will smell like toasted nuts. Take it off immediately and pour it into a bowl, scraping in every brown speck. From gold to burnt is about thirty seconds.</li>
<li>Let the butter cool for ten minutes. Hot butter scrambles eggs.</li>
<li>Heat the oven to 175°C and line a 900 g loaf tin.</li>
<li>Mash the bananas into the cooled butter, then whisk in the sugar, eggs and vanilla.</li>
<li>Whisk the flour, bicarbonate, salt and cinnamon together in a separate bowl, then fold the dry into the wet with a spatula. Stop as soon as the last streak of flour disappears — overmixing develops gluten and makes it tough and rubbery.</li>
<li>Fold in the chocolate or nuts. Scrape into the tin and bake for 55–65 minutes, until a skewer comes out with a few moist crumbs but no wet batter.</li>
<li>Cool in the tin for ten minutes, then turn out onto a rack. Cutting it hot will tear it.</li>
</ol>

<blockquote>Use a stainless or light-coloured pan. In a black non-stick pan you cannot see the butter change colour, and by the time you smell burning it is too late.</blockquote>

<h2>Keeping it</h2>
<p>Wrapped at room temperature it is good for three days and best on the second, once the crumb has settled. The fridge dries it out. It freezes well in slices — toast them straight from frozen.</p>`,
  },
  {
    title: 'How to Actually Salt Your Food',
    slug: 'how-to-salt-your-food',
    excerpt:
      'The most common reason home cooking tastes flat is not a missing ingredient. It is salt — the amount, and far more importantly, when it goes in.',
    metaDescription:
      'A practical guide to salting food: when to salt, how much, why salting early matters, and how to fix a dish you have oversalted.',
    coverImage: '/food/covers/salt.svg',
    publishedAt: '2026-06-28',
    content: `<p>If you cook something from a recipe and it tastes correct but somehow dull, the answer is almost never a missing herb. It is salt. Restaurant food tastes the way it does partly because professional kitchens salt at every stage, and home cooks overwhelmingly salt once, at the end, and not enough.</p>

<h2>Salt does more than taste salty</h2>
<p>Salt suppresses bitterness, which is why a pinch in coffee or dark chocolate makes them taste smoother. It amplifies aromatic compounds, so a properly salted tomato smells more like a tomato. And it draws moisture out of and then back into food, which changes texture as well as flavour.</p>
<p>That last mechanism is why <em>when</em> you salt matters more than how much.</p>

<h2>Salt early, in layers</h2>
<p>Salting at the end seasons the surface. Salting during cooking seasons the food. These produce genuinely different results from identical quantities of salt.</p>
<ul>
<li><strong>Meat:</strong> salt at least 40 minutes ahead, ideally the night before. Salt first draws moisture out, then that brine is reabsorbed, carrying seasoning into the muscle. Salting 5 minutes before cooking is the worst option — wet surface, no penetration.</li>
<li><strong>Vegetables:</strong> salt as they hit the pan. It draws out water, which helps them brown rather than steam.</li>
<li><strong>Pasta and grains:</strong> salt the water properly. It is the only chance to season the inside of a noodle. Water should taste seasoned, not like seawater — roughly 10 g per litre.</li>
<li><strong>Soups and stews:</strong> a little at each stage, then adjust at the end after reduction has concentrated everything.</li>
</ul>

<h2>Which salt, and why the type matters for measuring</h2>
<p>The salt itself is nearly identical chemically. What differs is crystal size, and therefore how much fits in a spoon.</p>
<ul>
<li><strong>Fine table salt</strong> is dense. A teaspoon holds a lot of salt, and it is easy to overshoot.</li>
<li><strong>Kosher or coarse salt</strong> is flaky and less dense — a teaspoon may hold half as much sodium as table salt. It is also easier to pinch and distribute evenly, which is why most professional kitchens use it.</li>
<li><strong>Flaky finishing salt</strong> is for the end, for crunch and bursts of salinity. Using it during cooking is a waste.</li>
</ul>
<p>If a recipe gives salt in teaspoons without specifying the type, assume it means fine salt and adjust if you are using coarse.</p>

<blockquote>Taste, season, taste again. Seasoning is a feedback loop, not a measurement. A recipe cannot know how salty your stock is.</blockquote>

<h2>How to tell when it is right</h2>
<p>The moment to look for is not "salty". It is when the dish suddenly tastes more like itself — the tomato tastes more tomato-ish, the soup gains definition. Add salt a small pinch at a time and taste after each; you will notice the switch flip. One pinch past that point and it starts tasting salty, which is one pinch too far.</p>

<h2>If you oversalt</h2>
<p>Most of the folk remedies do not work. A potato does not absorb meaningful salt. What actually helps:</p>
<ul>
<li><strong>Dilute.</strong> More unsalted liquid, more vegetables, more starch. The only true fix.</li>
<li><strong>Add acid.</strong> Lemon or vinegar distracts the palate and makes saltiness read as less severe.</li>
<li><strong>Add fat or dairy.</strong> Cream, yoghurt or butter coat the tongue and blunt the perception.</li>
<li><strong>Add sweetness,</strong> very cautiously. A pinch of sugar can balance; too much makes it strange.</li>
</ul>

<h2>The one-week experiment</h2>
<p>For a week, salt in stages and taste at every stage instead of following quantities. Most people find they have been using roughly half the salt their food needed, and that they stop reaching for other seasonings to compensate.</p>`,
  },
  {
    title: 'The Maillard Reaction, Explained for People Who Just Want Better Steak',
    slug: 'maillard-reaction-explained',
    excerpt:
      'Browning is not the same as burning, and it is not caramelisation either. Understanding what is happening on the surface of your food makes several problems obvious.',
    metaDescription:
      'What the Maillard reaction is, how it differs from caramelisation, and the four practical conditions that make food brown properly.',
    coverImage: '/food/covers/maillard.svg',
    publishedAt: '2026-06-22',
    content: `<p>Almost everything that makes cooked food smell good comes from one family of chemical reactions. Learning the four conditions it needs solves a surprising number of everyday problems — grey mince, pale roast potatoes, steaks that never get a crust.</p>

<h2>What it is</h2>
<p>The Maillard reaction is what happens when amino acids and certain sugars meet heat. They rearrange into hundreds of new compounds, which produce the colour and the smell of toast, seared meat, roasted coffee, fried onions and the crust of bread.</p>
<p>It is not caramelisation. Caramelisation is sugar breaking down on its own, needs no protein, and starts hotter — around 160°C for table sugar. The Maillard reaction needs protein as well as sugar and gets going meaningfully from about 140°C. Most browned food involves both, but Maillard produces the greater share of savoury complexity.</p>

<h2>The four conditions</h2>

<h3>1. A dry surface</h3>
<p>This is the one that catches everyone. Water boils at 100°C and will not go higher while it is present. As long as the surface of your food is wet, it cannot reach browning temperature — it is being steamed, at 100°C, in its own moisture.</p>
<p>Pat meat dry. Dry your chickpeas. Do not put wet vegetables in a hot pan. This single habit is worth more than any equipment.</p>

<h3>2. Enough heat</h3>
<p>Below about 140°C nothing much happens on a useful timescale. A pan that looks hot may not be — if you add oil and it sits there flat and still, it is not ready. It should shimmer and move.</p>

<h3>3. Space</h3>
<p>Crowding a pan drops its temperature and traps steam. Food releases water; if that water cannot escape, condition one fails and you are back to steaming. Cook in batches. It is faster than cooking one large grey batch and being disappointed.</p>

<h3>4. Time, but not too much</h3>
<p>Browning is not instantaneous, and rushing it with maximum heat gives you a burnt exterior and a raw interior. Burning is a different reaction — pyrolysis, the actual breakdown of the food into carbon — and it tastes acrid, not rich.</p>

<blockquote>Grey mince in a pan is not a cooking failure. It is a physics outcome: too much food, too little heat, nowhere for the water to go.</blockquote>

<h2>Things that help it along</h2>
<ul>
<li><strong>A pinch of sugar or a brush of honey</strong> on lean proteins gives the reaction more to work with.</li>
<li><strong>Alkalinity speeds it up.</strong> This is why a little bicarbonate of soda in the water makes onions caramelise faster and why pretzels are dipped in an alkaline solution before baking. Use tiny amounts — too much tastes soapy.</li>
<li><strong>Dairy browns readily,</strong> because milk proteins and lactose are both present. Butter browns; oil does not.</li>
</ul>

<h2>Applying it tonight</h2>
<ul>
<li><strong>Steak:</strong> dry the surface, salt ahead, get the pan properly hot, do not move it for two minutes.</li>
<li><strong>Roast potatoes:</strong> par-boil, steam-dry, roughen the surface, hot fat, single layer.</li>
<li><strong>Onions:</strong> a wide pan, medium heat, patience. Twenty-five minutes is not a typo, and turning the heat up makes them burn at the edges while staying raw in the middle.</li>
<li><strong>Mince:</strong> hot pan, two batches, spread it out and leave it alone before you break it up.</li>
</ul>

<h2>A note on safety</h2>
<p>Very high-temperature browning of starchy foods also produces acrylamide, which is why official guidance suggests aiming for golden rather than dark brown on things like chips and toast. Golden is where most of the flavour is anyway.</p>`,
  },
  {
    title: 'Knife Skills: The Four Cuts That Cover Almost Every Recipe',
    slug: 'knife-skills-four-cuts',
    excerpt:
      'You do not need culinary school. You need a grip, a claw, four cuts and a sharp knife — and the sharp knife is the part most people get wrong.',
    metaDescription:
      'Basic knife skills for home cooks: the correct grip, the claw, and the four cuts that cover most recipes. Plus why a dull knife is dangerous.',
    coverImage: '/food/covers/knife-skills.svg',
    publishedAt: '2026-06-16',
    content: `<p>Knife skills look like a professional flourish and are really just a way of making cooking less annoying. Evenly cut vegetables cook evenly, which means they are all ready at the same time, which means the dish works. That is the entire argument.</p>

<h2>Start with the grip</h2>
<p>Most people hold a knife with all four fingers on the handle and the index finger along the spine. That gives you almost no control over the blade.</p>
<p>The pinch grip: thumb and index finger pinch the blade itself, just in front of the handle. The remaining three fingers wrap the handle. Your hand is now gripping the knife at its balance point, and the blade becomes an extension of your arm rather than something you are pushing around.</p>
<p>It feels wrong for about a day and then feels obvious.</p>

<h2>The claw</h2>
<p>Curl the fingertips of your guiding hand under, knuckles forward. The flat of the blade rests against your knuckles, which act as a moving guide. Your fingertips are behind the knuckles and physically cannot reach the edge.</p>
<p>Move the claw backwards in small steps to set the width of each slice. This is what regulates thickness — not eyeballing it with the knife.</p>

<h2>The four cuts</h2>

<h3>1. The slice</h3>
<p>Tip of the knife stays on the board; you lift the heel and push forward and down. The knife rocks rather than chops. Almost nothing needs to leave the board.</p>

<h3>2. The dice</h3>
<p>Square the item off, cut it into planks, stack the planks and cut into batons, then cut the batons across. Every dice is the same three moves at different scales — 5 mm for a fine dice, 15 mm for a rough one.</p>

<h3>3. The julienne</h3>
<p>The batons from step two of the dice, stopped before the final cut. Matchsticks, roughly 3 mm square. Used for anything raw and crunchy, and for vegetables you want cooked very fast.</p>

<h3>4. The chiffonade</h3>
<p>For leaves. Stack them, roll them into a tight cigar, and slice across into ribbons. Basil and mint bruise easily — use a sharp knife, cut once, and do not saw back and forth.</p>

<blockquote>A dull knife is the dangerous one. It does not bite into the food, so it slips — and because you are pushing harder, it slips with force behind it.</blockquote>

<h2>Sharpening versus honing</h2>
<p>These are two different things and confusing them is why home knives are blunt.</p>
<ul>
<li><strong>Honing</strong> with a steel realigns an edge that has rolled over microscopically. It removes almost no metal. Do it every few uses; it takes ten seconds.</li>
<li><strong>Sharpening</strong> grinds a new edge with a whetstone or a pull-through sharpener. Do it a few times a year depending on use.</li>
</ul>
<p>Honing a genuinely blunt knife does nothing. If it will not slice a tomato skin without pressure, it needs sharpening.</p>

<h2>The three knives worth owning</h2>
<ul>
<li><strong>A chef's knife,</strong> 20 cm. Does 90% of everything.</li>
<li><strong>A paring knife</strong> for small in-hand work.</li>
<li><strong>A serrated bread knife,</strong> which also handles tomatoes and citrus.</li>
</ul>
<p>A block of fifteen knives is fifteen things to store and one knife you actually use.</p>

<h2>Board setup</h2>
<p>Put a damp cloth or a sheet of kitchen paper under the board. A board that slides is the second most common cause of accidents after a blunt blade, and it costs nothing to fix.</p>`,
  },
  {
    title: 'How to Build a Pantry That Cooks Dinner For You',
    slug: 'build-a-pantry-that-cooks',
    excerpt:
      'A well-chosen cupboard means the answer to "there is nothing in" is usually wrong. Here is what earns its shelf space and what does not.',
    metaDescription:
      'How to stock a pantry that turns into dinner: the core staples, the flavour multipliers, and the ingredients not worth the shelf space.',
    coverImage: '/food/covers/pantry.svg',
    publishedAt: '2026-06-10',
    content: `<p>"There is nothing in" almost always means "there is nothing obvious in". A cupboard built deliberately rather than accumulated by accident turns a fridge with three sad vegetables into dinner without a shop.</p>

<h2>The principle: bases and multipliers</h2>
<p>Think of the cupboard in two halves. <strong>Bases</strong> are bulk and calories — the thing dinner is built on. <strong>Multipliers</strong> are small, intense, and change the character of whatever they touch. Most people over-buy bases and under-buy multipliers, then wonder why everything tastes the same.</p>

<h2>Bases worth the space</h2>
<ul>
<li><strong>Two pasta shapes:</strong> one long, one short and ridged. That covers most sauces.</li>
<li><strong>Rice:</strong> a long grain for everyday, and a short grain if you make risotto or rice pudding.</li>
<li><strong>One quick grain:</strong> couscous cooks in five minutes off the kettle. Pearl barley and farro are better but slower.</li>
<li><strong>Tinned pulses:</strong> chickpeas, cannellini, black beans. Dried are cheaper and better but they require you to have decided about dinner yesterday.</li>
<li><strong>Tinned tomatoes,</strong> whole rather than chopped — better quality fruit and you can crush them yourself.</li>
<li><strong>Lentils,</strong> which need no soaking and cook in 25 minutes.</li>
<li><strong>Flour, oats, eggs and butter,</strong> which between them cover breakfast and most baking emergencies.</li>
</ul>

<h2>Multipliers, in order of usefulness</h2>
<ol>
<li><strong>Good olive oil</strong> for finishing, separate from the cheap oil you cook with.</li>
<li><strong>Acid:</strong> lemons, red wine vinegar, and one other — rice vinegar or sherry vinegar. Acid is the second most common thing missing from home cooking after salt.</li>
<li><strong>Anchovies.</strong> They dissolve into savoury depth and do not taste of fish. The most under-used tin in most kitchens.</li>
<li><strong>Tomato purée,</strong> fried properly rather than stirred in raw.</li>
<li><strong>Soy sauce and fish sauce,</strong> for salt with glutamate behind it.</li>
<li><strong>Mustard,</strong> which is a seasoning and an emulsifier. Every vinaigrette wants some.</li>
<li><strong>Chilli in two forms:</strong> dried flakes for heat during cooking, and a paste or sauce for heat at the table.</li>
<li><strong>Parmesan or another hard cheese,</strong> and keep the rinds in the freezer for stock and soup.</li>
<li><strong>Miso,</strong> which lasts a year in the fridge and improves soups, dressings and roast vegetables.</li>
<li><strong>Stock cubes or paste,</strong> chosen for low salt so you control the seasoning.</li>
</ol>

<blockquote>Buy whole spices where you can and grind them. Ground spices lose their aromatic oils within months, which is why the jar at the back of the cupboard tastes of dust.</blockquote>

<h2>Things not worth the shelf space</h2>
<ul>
<li><strong>Single-recipe spice blends</strong> bought for one dish and never opened again.</li>
<li><strong>Twelve vinegars.</strong> Three is plenty.</li>
<li><strong>Enormous bags of speciality flour</strong> unless you bake weekly. Flour goes stale and wholemeal goes rancid.</li>
<li><strong>Dried herbs that only work fresh.</strong> Dried basil, parsley and coriander are pale imitations. Dried oregano, thyme and bay are genuinely good.</li>
</ul>

<h2>Three dinners from the cupboard alone</h2>
<ul>
<li><strong>Pasta with anchovy, garlic and chilli:</strong> melt four anchovies into oil with sliced garlic and flakes, toss with spaghetti and pasta water.</li>
<li><strong>Chickpeas with tomato and cumin:</strong> fry the purée, add cumin, chickpeas and tinned tomatoes, simmer, finish with lemon and yoghurt.</li>
<li><strong>Lentil soup:</strong> onion, carrot, lentils, stock, a parmesan rind, and a hard squeeze of lemon at the end.</li>
</ul>

<h2>Rotate it</h2>
<p>Once a season, pull everything out. Bin what has expired, move what is nearly out of date to the front, and write a shopping list from the gaps. Twenty minutes, four times a year, and the cupboard stays useful instead of becoming an archive.</p>`,
  },
  {
    title: 'Why Your Pasta Sauce Slides Off the Pasta',
    slug: 'why-pasta-sauce-doesnt-stick',
    excerpt:
      'If you drain your pasta, put it in a bowl and spoon sauce on top, you are making two dishes that happen to be touching. Here is the fix, and why it works.',
    metaDescription:
      'Why pasta sauce does not cling, and how to fix it: pasta water, finishing in the pan, and the emulsion that binds sauce to noodle.',
    coverImage: '/food/covers/pasta-sauce.svg',
    publishedAt: '2026-06-04',
    content: `<p>There is a specific disappointment in draining pasta, spooning sauce over it, and finding a pool of watery orange liquid at the bottom of the bowl two minutes later. The pasta is fine. The sauce is fine. They are simply not combined, and combining them is a technique rather than an act of stirring.</p>

<h2>What "clinging" actually is</h2>
<p>A sauce that coats pasta is an emulsion — fat and water held together in suspension rather than separating. Left alone, oil and water refuse to mix. They need an emulsifier, and in pasta cooking that emulsifier is starch.</p>
<p>Starch molecules get in between the fat droplets and the water and stop them recombining into separate layers. The result is glossy, slightly thickened, and it sticks to a noodle instead of running off it.</p>

<h2>Where the starch comes from</h2>
<p>The pasta. As it boils, it sheds starch into the water. That cloudy water is not waste — it is the ingredient that makes the whole thing work, and pouring it entirely down the drain is the central mistake.</p>
<p>Two consequences follow:</p>
<ul>
<li><strong>Do not use an enormous pot of water.</strong> Less water means more concentrated starch. Enough to cover the pasta and let it move is plenty.</li>
<li><strong>Never rinse cooked pasta.</strong> Rinsing washes off the surface starch the sauce needs to grip. The only exception is pasta destined for a cold salad.</li>
</ul>

<h2>The method</h2>
<ol>
<li>Cook the pasta two minutes short of the packet time. It will finish in the sauce.</li>
<li>Before draining, take out a mugful of the cooking water. Do this <em>before</em>, because everybody forgets and then it is gone.</li>
<li>Drain the pasta but do not shake it dry.</li>
<li>Have the sauce hot in a wide pan. Add the pasta to the sauce — never the other way round — with a splash of the pasta water.</li>
<li>Turn the heat to medium-high and toss constantly for 60–90 seconds. Toss, do not stir: you are trying to agitate the fat and water together. The sauce will visibly change, going from loose and separate to thick and glossy.</li>
<li>Add more pasta water whenever it tightens too much. It should look slightly looser in the pan than you want on the plate.</li>
<li>Off the heat, add cheese and any fresh herbs and toss again.</li>
</ol>

<blockquote>Cheese added to a pan over direct heat will split into stringy clumps and a slick of oil. Always off the heat, always with a little pasta water.</blockquote>

<h2>Matching shape to sauce</h2>
<p>The old rules are practical rather than snobbish:</p>
<ul>
<li><strong>Long, thin</strong> — spaghetti, linguine — for smooth oil- or tomato-based sauces that coat.</li>
<li><strong>Short, ridged or hollow</strong> — rigatoni, penne, fusilli — for chunky sauces with something to catch.</li>
<li><strong>Wide and flat</strong> — pappardelle, tagliatelle — for rich, meaty, slow-cooked sauces that need surface area.</li>
<li><strong>Tiny shapes</strong> for soup, where they should not dominate a spoonful.</li>
</ul>

<h2>Common mistakes</h2>
<ul>
<li><strong>Oil in the cooking water.</strong> It coats the pasta and actively prevents sauce sticking. It does not stop sticking together either — stirring does.</li>
<li><strong>Cooking to the packet time exactly,</strong> then cooking further in the sauce, which gives you mush.</li>
<li><strong>Sauce spooned on top at the table.</strong> The single biggest cause of the puddle at the bottom of the bowl.</li>
<li><strong>Not enough salt in the water.</strong> The inside of a noodle can only be seasoned once.</li>
</ul>`,
  },
  {
    title: 'Read the Recipe First: The Case for Mise en Place',
    slug: 'mise-en-place-read-the-recipe',
    excerpt:
      'Professional kitchens prep everything before the first pan goes on the heat. At home the same habit turns stressful cooking into something closer to assembly.',
    metaDescription:
      'What mise en place means for home cooks, why reading the recipe twice matters, and how to prep without creating a mountain of bowls.',
    coverImage: '/food/covers/mise-en-place.svg',
    publishedAt: '2026-05-29',
    content: `<p>Mise en place translates roughly as "everything in its place", and in a professional kitchen it is not a philosophy — it is the only way service is physically possible. At home it solves a smaller but very familiar problem: the moment you realise the garlic needed chopping while the onions were already burning.</p>

<h2>Read it twice, properly</h2>
<p>Read the recipe once for the shape of it and once for the timing. On the second pass you are looking for specific traps:</p>
<ul>
<li><strong>Hidden waiting time.</strong> "Chill for two hours" and "bring to room temperature" and "marinate overnight" are frequently buried mid-paragraph.</li>
<li><strong>Ingredients that appear in the method but not the list,</strong> or vice versa. It happens more than you would like.</li>
<li><strong>Steps that overlap.</strong> If the sauce simmers for twenty minutes, that is when you cook the rice — not after.</li>
<li><strong>Equipment you may not own,</strong> discovered at step six rather than step zero.</li>
</ul>
<p>Two minutes of reading routinely saves twenty minutes of scrambling.</p>

<h2>What to prep, and what not to</h2>
<p>Prepping absolutely everything into individual ramekins is a television format, not a domestic one. It generates enormous washing up for very little benefit. A more useful rule:</p>
<ul>
<li><strong>Prep anything needed in the first five minutes of active cooking.</strong> Once a pan is hot, you have no attention to spare.</li>
<li><strong>Prep anything that goes in quickly after something else.</strong> Garlic that follows onions by thirty seconds must already be chopped.</li>
<li><strong>Group things that go in together into one bowl.</strong> Spices that all hit the pan at the same moment do not need four bowls.</li>
<li><strong>Do not bother prepping things added during a long simmer.</strong> You will have plenty of time.</li>
</ul>

<h2>Set the workspace up</h2>
<p>Before anything is cut:</p>
<ol>
<li>Clear the counter. Cooking in a fifteen-centimetre gap between the kettle and yesterday's post is unnecessarily hard.</li>
<li>Damp cloth under the chopping board.</li>
<li>A bowl for scraps within arm's reach. Walking to the bin fourteen times is the hidden tax on prep.</li>
<li>Bin bowl, board, knife, and the pan you will need — in that order, left to right if you are right-handed.</li>
</ol>

<blockquote>Clean as you go. A sink filling up behind you steadily reduces the space you have to work in, and the meal ends with the worst part still ahead of you.</blockquote>

<h2>The timing map</h2>
<p>For anything with more than one component, work backwards from when you want to eat. If the chicken needs 40 minutes and the rice needs 20 and the salad needs 5, you now know the order and can start the chicken 45 minutes out with a clear conscience.</p>
<p>Written down on the back of an envelope, this is what a professional kitchen calls a prep list. At home it is the difference between three components arriving together and three components arriving fifteen minutes apart.</p>

<h2>What changes</h2>
<p>The benefit is not really speed — a prepped cook and an unprepped cook finish at similar times. The benefit is that one of them enjoyed it. Cooking becomes a series of calm, deliberate moves rather than a race you are already losing at step four.</p>`,
  },
  {
    title: 'Meal Prep Without Eating the Same Thing Five Days Running',
    slug: 'meal-prep-without-boredom',
    excerpt:
      'The reason meal prep fails is not effort. It is that five identical containers are depressing by Wednesday. Prep components instead of meals.',
    metaDescription:
      'A component-based approach to meal prep: cook building blocks rather than finished meals, so five lunches are five different lunches.',
    coverImage: '/food/covers/meal-prep.svg',
    publishedAt: '2026-05-23',
    content: `<p>Almost everyone who abandons meal prep abandons it for the same reason, and it is not the Sunday afternoon. It is opening the fridge on Wednesday, seeing the third identical container, and ordering something instead.</p>

<h2>Prep components, not meals</h2>
<p>The fix is to stop cooking five lunches and start cooking a small number of building blocks that combine differently. Five finished meals give you one option repeated five times. Five components give you a genuine choice each morning at almost identical effort.</p>
<p>A working set looks like this:</p>
<ul>
<li><strong>One grain</strong> — rice, barley, couscous</li>
<li><strong>One protein</strong> — roast chicken, boiled eggs, spiced chickpeas, marinated tofu</li>
<li><strong>One roasted vegetable</strong> — whatever is cheap and in season</li>
<li><strong>One raw, crunchy thing</strong> — shredded cabbage, cucumber, quick-pickled onion</li>
<li><strong>Two sauces</strong> — this is the part people skip and it is the part that does the work</li>
</ul>

<h2>Why two sauces matter more than a third vegetable</h2>
<p>The same grain, protein and vegetable with a lemon tahini dressing is a completely different lunch to the same three with a soy, ginger and sesame dressing. Sauce is the cheapest possible variety, takes five minutes, and keeps for a week.</p>
<p>Two dressings that cover a lot of ground:</p>
<ul>
<li><strong>Lemon tahini:</strong> 3 tbsp tahini, juice of a lemon, a grated garlic clove, water to loosen, salt.</li>
<li><strong>Soy, ginger and sesame:</strong> 3 tbsp soy, 1 tbsp rice vinegar, 1 tsp sesame oil, 1 tsp honey, a thumb of grated ginger.</li>
</ul>

<h2>A two-hour Sunday</h2>
<ol>
<li>Oven on at 200°C. Two trays in: one of vegetables, one of chickpeas or chicken thighs.</li>
<li>Grain on the hob. Eggs boiling in a second pan.</li>
<li>While those run, make both dressings and do the quick pickle — sliced red onion in vinegar with a pinch of salt and sugar, done in twenty minutes and good for two weeks.</li>
<li>Cool everything properly before it goes in the fridge. This is a food safety point, not a texture one: get cooked food from hot to chilled within about two hours.</li>
<li>Store components separately. Assembly happens in the morning and takes ninety seconds.</li>
</ol>

<blockquote>Store wet and dry apart. A dressed grain sitting for four days is a different and much worse thing than a grain dressed that morning.</blockquote>

<h2>Realistic shelf life</h2>
<ul>
<li><strong>Cooked grains:</strong> 3–4 days. Cool rice fast and refrigerate promptly.</li>
<li><strong>Roasted vegetables:</strong> 4 days, though they soften.</li>
<li><strong>Cooked chicken:</strong> 3 days.</li>
<li><strong>Boiled eggs, in shell:</strong> up to a week.</li>
<li><strong>Dressings:</strong> a week, sometimes longer.</li>
</ul>
<p>Which means prepping for five days is optimistic. Prep for three and cook something fresh on Thursday and Friday — the plan you actually follow beats the plan that collapses.</p>

<h2>Beating the Wednesday problem directly</h2>
<ul>
<li><strong>Change the format, not the ingredients.</strong> Monday a bowl, Tuesday a wrap, Wednesday the same things on top of soup.</li>
<li><strong>Keep a jar of something sharp</strong> — pickles, kimchi, chilli oil — to change the whole character of a lunch in one spoonful.</li>
<li><strong>Toast, fry or char something</strong> at the last minute. Texture is what leftovers lose first.</li>
</ul>`,
  },
  {
    title: 'Freezing Food Properly: What Works, What Does Not',
    slug: 'freezing-food-properly',
    excerpt:
      'The freezer is the most under-used appliance in most kitchens, largely because a few disappointing experiments taught the wrong lesson.',
    metaDescription:
      'What freezes well and what does not, why ice crystals ruin texture, and how to avoid freezer burn. A practical freezing guide.',
    coverImage: '/food/covers/freezing.svg',
    publishedAt: '2026-05-17',
    content: `<p>Most people's freezers contain a bag of peas, some ice, and two unlabelled containers of something brown. Used properly it is the single best tool for cutting food waste and for making a Tuesday easier — but only once you know what survives the trip and what does not.</p>

<h2>The physics, briefly</h2>
<p>Freezing turns the water in food into ice crystals. Those crystals have sharp edges and they puncture cell walls. When the food thaws, the ruptured cells cannot hold their water any more and it runs out — which is why a thawed strawberry is a sad, floppy thing.</p>
<p>Two rules follow directly:</p>
<ul>
<li><strong>Faster freezing makes smaller crystals.</strong> Small crystals do less damage. Spread things thin, do not overload the freezer, and use the coldest part.</li>
<li><strong>High-water, delicate-structure foods suffer most.</strong> This predicts nearly every success and failure below.</li>
</ul>

<h2>Freezes well</h2>
<ul>
<li><strong>Soups, stews, ragùs, curries.</strong> Already broken down; texture damage is irrelevant. These are often better after freezing.</li>
<li><strong>Raw meat and fish,</strong> wrapped tightly.</li>
<li><strong>Bread and baked goods.</strong> Slice bread before freezing and toast from frozen.</li>
<li><strong>Butter, hard cheese</strong> (grated is best), and cream in cooking quantities.</li>
<li><strong>Blanched vegetables:</strong> beans, peas, broccoli, spinach. Blanching stops the enzymes that cause off flavours.</li>
<li><strong>Herbs in oil,</strong> chopped into an ice cube tray topped with olive oil.</li>
<li><strong>Stock,</strong> ideally reduced first so it takes less space.</li>
<li><strong>Cookie dough,</strong> portioned into balls and baked from frozen with a couple of extra minutes.</li>
</ul>

<h2>Freezes badly</h2>
<ul>
<li><strong>Salad leaves, cucumber, raw tomato.</strong> Nearly all water, no structure left after thawing.</li>
<li><strong>Potatoes in stews.</strong> They go grainy. Freeze the stew without them and add fresh on reheating.</li>
<li><strong>Cream-based sauces and plain yoghurt.</strong> They split. A flour-thickened white sauce survives better than a pure cream one.</li>
<li><strong>Soft cheeses and mayonnaise.</strong> Emulsions break and do not come back.</li>
<li><strong>Fried food.</strong> It can be frozen, but the crisp is gone for good.</li>
<li><strong>Boiled eggs.</strong> The whites turn rubbery.</li>
</ul>

<blockquote>Freezer burn is dehydration, not contamination. Air reaches the surface, moisture sublimates away and leaves greyish dry patches. It is safe to eat and it tastes of nothing.</blockquote>

<h2>Packing it properly</h2>
<ol>
<li><strong>Cool completely first.</strong> Warm food raises the freezer temperature and partially thaws its neighbours.</li>
<li><strong>Remove air.</strong> Press bags flat, push out the air, or float a container in water to displace it before sealing.</li>
<li><strong>Freeze flat,</strong> then stack. Flat bags freeze faster, thaw faster and store better than round tubs.</li>
<li><strong>Portion for how you will use it.</strong> A two-litre block of soup is a commitment; four one-portion bags are dinner.</li>
<li><strong>Label everything</strong> with contents and date. You will not remember. Nobody remembers.</li>
</ol>

<h2>Thawing</h2>
<p>Overnight in the fridge is the safest method and the best for texture. In a pinch, a sealed bag under cold running water works. Room temperature is the one to avoid — the outside sits in the bacterial danger zone for hours while the middle is still frozen. Soups and stews can go straight from frozen into a pan on a low heat.</p>

<h2>How long is it good for</h2>
<p>Frozen food stays safe indefinitely at a steady −18°C. Quality is the limiting factor: three months for most cooked dishes, six for raw meat, a year for bread if it is well wrapped. After that it is edible and dull.</p>`,
  },
  {
    title: 'Cutting Your Grocery Bill Without Eating Worse',
    slug: 'cut-grocery-bill',
    excerpt:
      'Not a list of miserable substitutions. The biggest savings come from waste, planning and a handful of ingredients that punch far above their price.',
    metaDescription:
      'How to spend less on food without eating worse: reduce waste, shop the right way, and use cheap ingredients that carry a meal.',
    coverImage: '/food/covers/grocery-budget.svg',
    publishedAt: '2026-05-11',
    content: `<p>Most advice about cheap eating assumes you are willing to eat worse. You do not have to be. The largest savings in a normal household are not in swapping ingredients for inferior ones — they are in the food that gets thrown away, and in the trips to the shop that had no plan behind them.</p>

<h2>Start with what you bin</h2>
<p>Households throw away a startling share of the food they buy, and it is overwhelmingly fresh produce, bread and leftovers. Every item binned is money already spent, which makes waste the highest-return place to start.</p>
<ul>
<li><strong>Shop your fridge first.</strong> Before writing a list, look at what is already there and build around it.</li>
<li><strong>Keep an "eat me first" shelf</strong> at eye level for anything on its way out.</li>
<li><strong>Learn the date labels.</strong> "Use by" is a safety instruction. "Best before" is a quality estimate — flour, pasta, tins and most hard cheese are fine well past it.</li>
<li><strong>Have one improvised meal a week.</strong> A frittata, a soup, a fried rice. All three exist to absorb odds and ends.</li>
</ul>

<h2>Ingredients that carry a meal cheaply</h2>
<ul>
<li><strong>Dried pulses.</strong> Roughly a third the price of tinned. Soak overnight or use a pressure cooker.</li>
<li><strong>Eggs,</strong> still the cheapest complete protein in most places.</li>
<li><strong>Whole chicken</strong> instead of breasts. Roast it, use the meat across two meals, then boil the carcass for stock.</li>
<li><strong>Cheaper cuts:</strong> shin, shoulder, thigh. They need time, not money, and they taste better than lean cuts in anything braised.</li>
<li><strong>Frozen vegetables.</strong> Frozen at harvest, often nutritionally equal or better than fresh that has travelled, and no waste.</li>
<li><strong>Tinned fish.</strong> Sardines and mackerel are cheap, good and keep for years.</li>
<li><strong>In-season produce,</strong> which is cheap precisely because there is a lot of it.</li>
</ul>

<blockquote>Cheap food that nobody eats is expensive. A bargain bag of vegetables that rots in the drawer costs more than the smaller bag you would have finished.</blockquote>

<h2>How you shop</h2>
<ul>
<li><strong>Go with a list built from a plan.</strong> Unplanned shopping is where the budget goes.</li>
<li><strong>Compare unit prices,</strong> not pack prices. The shelf label usually shows price per kilo — it is the only honest number.</li>
<li><strong>Bulk only what you will finish.</strong> Rice, oats, pulses and tins, yes. Fresh produce, rarely.</li>
<li><strong>Be sceptical of multibuys</strong> on perishables. Two for the price of one and a half is worthless if one goes in the bin.</li>
<li><strong>Try the supermarket's own brand</strong> on staples. On flour, tinned tomatoes, pulses and frozen vegetables the difference is often packaging.</li>
</ul>

<h2>Cook in a way that saves money</h2>
<ul>
<li><strong>Batch the base, vary the finish.</strong> One pot of tomato and lentil base becomes soup, a pasta sauce and a filling for baked potatoes.</li>
<li><strong>Make stock from scraps.</strong> Keep a bag in the freezer for onion ends, carrot peel, herb stalks and parmesan rinds.</li>
<li><strong>Use meat as a flavouring rather than the centre.</strong> A hundred grams of bacon or sausage can season a dish for four.</li>
<li><strong>Stale bread is an ingredient:</strong> breadcrumbs, croutons, panzanella, bread soup.</li>
</ul>

<h2>What is worth paying more for</h2>
<p>Spending less overall does not mean spending less on everything. Good olive oil, decent salt and real parmesan are used in small quantities and change the taste of everything they touch. Save on the bulk, spend on the multipliers.</p>`,
  },
  {
    title: 'Rescuing Dinner: Fixes for Salty, Bland, Watery and Burnt',
    slug: 'rescue-a-dish',
    excerpt:
      'Most kitchen disasters are recoverable if you know which lever to pull. A diagnostic guide to the four ways dinner usually goes wrong.',
    metaDescription:
      'How to fix over-salted, bland, watery, greasy or burnt food. A practical troubleshooting guide for when dinner goes wrong.',
    coverImage: '/food/covers/rescue-dinner.svg',
    publishedAt: '2026-05-05',
    content: `<p>Every cook produces the occasional disaster. The difference between an experienced one and a beginner is rarely that the experienced cook makes fewer mistakes — it is that they recognise which mistake it is and know there is usually something to be done about it.</p>

<h2>It is too salty</h2>
<p>The potato trick does not work; a potato absorbs water, and the salt dissolved in that water stays dissolved. What does work:</p>
<ul>
<li><strong>Dilute.</strong> Add more of everything unsalted — stock, water, tinned tomatoes, extra vegetables. The only genuine fix.</li>
<li><strong>Add acid.</strong> Lemon or vinegar makes salt read as less aggressive.</li>
<li><strong>Add fat or dairy.</strong> Cream, yoghurt or butter coats the tongue and blunts it.</li>
<li><strong>Serve it over something bland.</strong> Plain rice, potatoes or bread rebalance the plate even if you cannot rebalance the pot.</li>
</ul>

<h2>It tastes of nothing</h2>
<p>Work through these in order, tasting after each. It is almost always the first one.</p>
<ol>
<li><strong>Salt.</strong> Ninety per cent of the time.</li>
<li><strong>Acid.</strong> Lemon juice or vinegar. Flat, heavy, rich dishes are usually missing brightness rather than seasoning.</li>
<li><strong>Umami.</strong> A dash of fish sauce or soy, a squeeze of tomato purée, a parmesan rind, a mashed anchovy.</li>
<li><strong>Fat.</strong> A knob of butter or a swirl of good olive oil at the end carries flavour to the palate.</li>
<li><strong>Freshness.</strong> Herbs, zest or something raw and crunchy on top.</li>
<li><strong>Heat.</strong> Chilli, black pepper, mustard — last, because it masks rather than fixes.</li>
</ol>

<h2>It is watery</h2>
<ul>
<li><strong>Reduce it.</strong> Take the lid off, turn the heat up, and let evaporation work. Best flavour, costs time.</li>
<li><strong>Cornflour slurry.</strong> One teaspoon in a tablespoon of cold water, stirred in, simmered for a minute. Never add dry cornflour to hot liquid.</li>
<li><strong>Blend some of it.</strong> Take out a ladleful of the solids, blitz, stir back. Thickens without diluting.</li>
<li><strong>Add a starch:</strong> a spoon of mashed potato, some red lentils, a handful of breadcrumbs.</li>
</ul>

<h2>It is greasy</h2>
<ul>
<li><strong>Skim it.</strong> A wide spoon across the surface, or chill until the fat sets and lift it off.</li>
<li><strong>An ice cube</strong> dragged across the surface for a few seconds solidifies fat onto it. Remove immediately.</li>
<li><strong>Acid again.</strong> It cuts the perception of richness even when the fat is still there.</li>
</ul>

<h2>It has caught on the bottom</h2>
<p>Stop stirring immediately — every stir mixes more of the burnt layer into the food, and burnt flavour is powerful and one-directional.</p>
<ol>
<li>Take the pan off the heat at once.</li>
<li>Pour or spoon everything above the burnt layer into a clean pan without scraping. Leave the bottom behind entirely.</li>
<li>Taste. If a faint smokiness remains, a spoon of sugar, a splash of cream or a squeeze of lemon can mask a little.</li>
<li>If the burnt taste has gone all the way through, stop. This is the one failure that is not recoverable, and serving it anyway teaches nobody anything.</li>
</ol>

<blockquote>Taste as you go and you will catch three of these four before they happen. Most disasters are simply mistakes that were not noticed early enough.</blockquote>

<h2>Overcooked and dry</h2>
<p>Dry meat cannot be un-dried, but it can be repurposed. Shred it and fold it into a sauce, a soup or a filling where the surrounding moisture does the work. Overcooked vegetables become soup with far more grace than they return to the plate.</p>`,
  },
]
