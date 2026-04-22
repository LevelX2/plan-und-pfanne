import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../recipes.module.css";
import { formatCalories, formatGrams, formatMealType, formatShoppingQuantity } from "@/lib/format";
import { getRecipeById } from "@/lib/store";

export const dynamic = "force-dynamic";

type RecipeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/">Dashboard</Link>
        <Link href="/rezepte">Rezepte</Link>
        <Link href="/einkaufsliste">Einkaufsliste</Link>
        <Link href="/einstellungen">Einstellungen</Link>
      </nav>

      <section className={styles.detailHero}>
        <div className={styles.detailHeroText}>
          <p className={styles.eyebrow}>{formatMealType(recipe.mealType)}</p>
          <h1>{recipe.name}</h1>
          <p className={styles.lead}>{recipe.description}</p>

          <div className={styles.tagRow}>
            <span className={styles.tag}>glutenfrei</span>
            <span className={styles.tag}>{recipe.vegetarian ? "vegetarisch" : recipe.proteinSource}</span>
            <span className={styles.tag}>{recipe.prepTimeMinutes} Minuten</span>
          </div>
        </div>

        <aside className={styles.macroPanel}>
          <p className={styles.sectionKicker}>Makros pro Portion</p>
          <div className={styles.metricList}>
            <div>
              <span>Kalorien</span>
              <strong>{formatCalories(recipe.calories)}</strong>
            </div>
            <div>
              <span>Protein</span>
              <strong>{formatGrams(recipe.proteinG)}</strong>
            </div>
            <div>
              <span>Kohlenhydrate</span>
              <strong>{formatGrams(recipe.carbsG)}</strong>
            </div>
            <div>
              <span>Fett</span>
              <strong>{formatGrams(recipe.fatG)}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.detailGrid}>
        <article className={styles.groupCard}>
          <p className={styles.sectionKicker}>Zutaten</p>
          <h2>Was du brauchst</h2>
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((ingredient) => (
              <li key={`${recipe.id}-${ingredient.name}`}>
                <div>
                  <strong>{ingredient.name}</strong>
                  <span>{ingredient.category}</span>
                </div>
                <span>{formatShoppingQuantity(ingredient.amount, ingredient.unit)}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.groupCard}>
          <p className={styles.sectionKicker}>Zubereitung</p>
          <h2>So gehst du vor</h2>
          <ol className={styles.instructions}>
            {recipe.instructions.map((step, index) => (
              <li key={`${recipe.id}-step-${index + 1}`}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
