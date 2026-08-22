import { calculateGes } from "./src/lib/gesCalc";

for (const budget of [200, 300, 600, 1200]) {
  const r = calculateGes(budget, "mesken")!;
  console.log(`\n--- Budget alimentaire : $${budget}/mois ("Home Cooking") ---`);
  console.log(`  Weekly Cook Sessions      : ${r.systemKwp}`);
  console.log(`  Recipes In Your Plan      : ${r.panelCount} recipes`);
  console.log(`  Average Prep Time         : ~${r.roofArea} min`);
  console.log(`  Estimated Yearly Servings : ${r.annualProduction.toLocaleString("en-US")} servings`);
  console.log(`  Estimated Yearly Savings  : $${r.annualSavings.toLocaleString("en-US")}`);
  console.log(`  (budget annuel réel       : $${(budget*12).toLocaleString("en-US")})`);
}
