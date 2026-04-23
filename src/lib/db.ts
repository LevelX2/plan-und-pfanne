import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { seedRecipes } from "@/lib/data/seed-recipes";

const DEFAULT_RECIPE_MIX = {
  vegetarianSharePct: 40,
  fishSharePct: 20,
  meatSharePct: 40,
} as const;

const DEFAULT_DB_PATH = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "data",
  "planner.sqlite",
);

function resolveDbPath() {
  if (process.env.DATA_DIR) {
    return path.join(/*turbopackIgnore: true*/ process.env.DATA_DIR, "planner.sqlite");
  }

  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return path.join(
      /*turbopackIgnore: true*/ process.env.RAILWAY_VOLUME_MOUNT_PATH,
      "planner.sqlite",
    );
  }

  return DEFAULT_DB_PATH;
}

const DB_PATH = resolveDbPath();
const DATA_DIR = path.dirname(DB_PATH);

let dbInstance: Database.Database | null = null;

function timestamp() {
  return new Date().toISOString();
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createTables(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      calorie_target INTEGER NOT NULL,
      macro_carbs_pct REAL NOT NULL,
      macro_fat_pct REAL NOT NULL,
      macro_protein_pct REAL NOT NULL,
      meals_per_day INTEGER NOT NULL,
      gluten_free_only INTEGER NOT NULL DEFAULT 1,
      vegetarian INTEGER NOT NULL DEFAULT 0,
      reduce_meat INTEGER NOT NULL DEFAULT 0,
      vegetarian_share_pct REAL NOT NULL DEFAULT 40,
      fish_share_pct REAL NOT NULL DEFAULT 20,
      meat_share_pct REAL NOT NULL DEFAULT 40,
      excluded_ingredients_json TEXT NOT NULL DEFAULT '[]',
      max_recipe_repeats_per_week INTEGER NOT NULL DEFAULT 2,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      gluten_free INTEGER NOT NULL,
      vegetarian INTEGER NOT NULL,
      prep_time_minutes INTEGER NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      ingredients_json TEXT NOT NULL,
      instructions_text TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      protein_source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL UNIQUE,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      generated_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekly_plan_id INTEGER NOT NULL,
      date TEXT NOT NULL UNIQUE,
      total_calories REAL NOT NULL,
      total_protein_g REAL NOT NULL,
      total_carbs_g REAL NOT NULL,
      total_fat_g REAL NOT NULL,
      score REAL NOT NULL,
      FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_plan_id INTEGER NOT NULL,
      recipe_id TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      portion_factor REAL NOT NULL,
      FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );
  `);
}

function hasColumn(db: Database.Database, tableName: string, columnName: string) {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return rows.some((row) => row.name === columnName);
}

function addUserSettingsColumn(
  db: Database.Database,
  columnName: string,
  defaultValue: number,
) {
  if (hasColumn(db, "user_settings", columnName)) {
    return false;
  }

  db.exec(
    `ALTER TABLE user_settings ADD COLUMN ${columnName} REAL NOT NULL DEFAULT ${defaultValue}`,
  );

  return true;
}

function migrateUserSettingsRecipeMix(db: Database.Database) {
  const addedVegetarian = addUserSettingsColumn(
    db,
    "vegetarian_share_pct",
    DEFAULT_RECIPE_MIX.vegetarianSharePct,
  );
  const addedFish = addUserSettingsColumn(db, "fish_share_pct", DEFAULT_RECIPE_MIX.fishSharePct);
  const addedMeat = addUserSettingsColumn(db, "meat_share_pct", DEFAULT_RECIPE_MIX.meatSharePct);

  if (!addedVegetarian && !addedFish && !addedMeat) {
    return;
  }

  db.exec(`
    UPDATE user_settings
    SET
      vegetarian_share_pct = CASE
        WHEN vegetarian = 1 THEN 100
        WHEN reduce_meat = 1 THEN 45
        ELSE ${DEFAULT_RECIPE_MIX.vegetarianSharePct}
      END,
      fish_share_pct = CASE
        WHEN vegetarian = 1 THEN 0
        WHEN reduce_meat = 1 THEN 20
        ELSE ${DEFAULT_RECIPE_MIX.fishSharePct}
      END,
      meat_share_pct = CASE
        WHEN vegetarian = 1 THEN 0
        WHEN reduce_meat = 1 THEN 35
        ELSE ${DEFAULT_RECIPE_MIX.meatSharePct}
      END
    WHERE id = 1
  `);
}

function seedDefaults(db: Database.Database) {
  db.prepare(`
    INSERT OR IGNORE INTO user_settings (
      id,
      calorie_target,
      macro_carbs_pct,
      macro_fat_pct,
      macro_protein_pct,
      meals_per_day,
      gluten_free_only,
      vegetarian,
      reduce_meat,
      vegetarian_share_pct,
      fish_share_pct,
      meat_share_pct,
      excluded_ingredients_json,
      max_recipe_repeats_per_week,
      created_at,
      updated_at
    ) VALUES (
      1,
      2000,
      30,
      30,
      40,
      4,
      1,
      0,
      0,
      40,
      20,
      40,
      '[]',
      2,
      @createdAt,
      @updatedAt
    )
  `).run({
    createdAt: timestamp(),
    updatedAt: timestamp(),
  });

  const insertRecipe = db.prepare(`
    INSERT OR IGNORE INTO recipes (
      id,
      name,
      description,
      meal_type,
      gluten_free,
      vegetarian,
      prep_time_minutes,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      ingredients_json,
      instructions_text,
      tags_json,
      protein_source,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @name,
      @description,
      @mealType,
      @glutenFree,
      @vegetarian,
      @prepTimeMinutes,
      @calories,
      @proteinG,
      @carbsG,
      @fatG,
      @ingredientsJson,
      @instructionsText,
      @tagsJson,
      @proteinSource,
      @createdAt,
      @updatedAt
    )
  `);

  const seedTransaction = db.transaction(() => {
    for (const recipe of seedRecipes) {
      insertRecipe.run({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        mealType: recipe.mealType,
        glutenFree: recipe.glutenFree ? 1 : 0,
        vegetarian: recipe.vegetarian ? 1 : 0,
        prepTimeMinutes: recipe.prepTimeMinutes,
        calories: recipe.calories,
        proteinG: recipe.proteinG,
        carbsG: recipe.carbsG,
        fatG: recipe.fatG,
        ingredientsJson: JSON.stringify(recipe.ingredients),
        instructionsText: recipe.instructions.join("\n"),
        tagsJson: JSON.stringify(recipe.tags),
        proteinSource: recipe.proteinSource,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      });
    }
  });

  seedTransaction();
}

export function getDb() {
  if (!dbInstance) {
    ensureDataDir();
    dbInstance = new Database(DB_PATH);
    createTables(dbInstance);
    migrateUserSettingsRecipeMix(dbInstance);
    seedDefaults(dbInstance);
  }

  return dbInstance;
}
