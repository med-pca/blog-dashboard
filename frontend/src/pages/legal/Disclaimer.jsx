import LegalPage from "../../components/LegalPage";
import { LEGAL_CONTACT, LEGAL_OWNER, LEGAL_UPDATED } from "../../lib/legal";

const SECTIONS = [
  {
    title: "1. General information only",
    body: `Everything published by ${LEGAL_OWNER} — recipes, guides, planning tools and kitchen tips — is offered for general information and inspiration. Articles are editorially reviewed before publication, but not every recipe is physically kitchen-tested. We cannot guarantee that the information is complete, current or suited to your situation.`,
  },
  {
    title: "2. Not health, dietary or medical advice",
    body: `We are cooks, not doctors, dietitians or nutritionists. Nothing on this site is medical, nutritional or dietary advice, and it is not a substitute for a consultation with a qualified professional.

If you are pregnant, managing a medical condition, taking medication, or following a diet prescribed to you, talk to your doctor or dietitian before changing what you eat. Never disregard professional advice because of something you read here.`,
  },
  {
    title: "3. Allergies and intolerances",
    body: `Ingredient lists describe what we used, not what is safe for you. Recipes may contain or be cross-contaminated with common allergens such as milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish and sesame.

Checking every label, every time, is your responsibility — formulations change, and a brand that was safe last month may not be today. If you or anyone you cook for has an allergy or intolerance, verify each ingredient before you start.`,
  },
  {
    title: "4. Nutrition figures",
    body: `Where nutrition information appears, it is an estimate produced from generic ingredient databases. Real values shift with brands, substitutions, portion sizes and cooking method. Treat the figures as a rough guide, not a measurement, and do not rely on them for medical or clinical purposes.`,
  },
  {
    title: "5. Food safety and cooking",
    body: `Cooking involves heat, sharp tools, hot oil and raw ingredients. Follow the food safety guidance issued by the authority in your country — particularly on safe internal temperatures, cooling, storage and reheating.

Times and temperatures in our recipes are guidance: ovens, hobs and pans vary, so judge doneness by the food rather than the clock. You are responsible for handling ingredients and equipment safely, and for supervising anyone cooking with you.`,
  },
  {
    title: "6. Results vary",
    body: `Any cost, timing, portion or savings figure on this site — including anything produced by the planning tools — is an illustrative estimate based on standard assumptions. It is not a promise of a particular outcome. Your own results will depend on your prices, your habits and your kitchen.`,
  },
  {
    title: "7. Advertising",
    body: `This site is supported by advertising. Advertisements are selected and served by third-party networks, not chosen by us, and their presence is not an endorsement of the advertised product or service.

If we ever publish sponsored content or use affiliate links, we will say so clearly on the page concerned.`,
  },
  {
    title: "8. External links",
    body: `We link to other sites when they are useful. We do not control them, we are not responsible for their content or accuracy, and a link is not an endorsement.`,
  },
  {
    title: "9. Your responsibility",
    body: `You use this site, and cook from it, at your own risk. To the fullest extent permitted by law, ${LEGAL_OWNER} accepts no liability for any loss, illness, injury or damage arising from the use of our recipes or information.

Questions: ${LEGAL_CONTACT}`,
  },
];

export default function Disclaimer() {
  return (
    <LegalPage
      title="Disclaimer"
      description="Important notes on allergies, nutrition estimates, food safety and advertising on Pulse Recipe."
      updated={LEGAL_UPDATED}
      intro="Please read this before cooking from our recipes — especially the sections on allergies and food safety."
      sections={SECTIONS}
    />
  );
}
