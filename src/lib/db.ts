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

function tableExists(db: Database.Database, tableName: string) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { name: string } | undefined;

  return Boolean(row);
}

function getTableSql(db: Database.Database, tableName: string) {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { sql: string } | undefined;

  return row?.sql ?? null;
}

function hasColumn(db: Database.Database, tableName: string, columnName: string) {
  if (!tableExists(db, tableName)) {
    return false;
  }

  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return rows.some((row) => row.name === columnName);
}

function createCoreTables(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      display_name TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS auth_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      display_name TEXT,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      consumed_at TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_auth_challenges_email_created_at
      ON auth_challenges(email, created_at DESC);

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

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
  `);
}

function createUserSettingsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
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
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function createPlanningTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      generated_by TEXT NOT NULL,
      UNIQUE(user_id, start_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekly_plan_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      total_calories REAL NOT NULL,
      total_protein_g REAL NOT NULL,
      total_carbs_g REAL NOT NULL,
      total_fat_g REAL NOT NULL,
      score REAL NOT NULL,
      UNIQUE(weekly_plan_id, date),
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

function dropTableIfExists(db: Database.Database, tableName: string) {
  if (tableExists(db, tableName)) {
    db.exec(`DROP TABLE ${tableName}`);
  }
}

function renameTableIfExists(db: Database.Database, fromTable: string, toTable: string) {
  if (tableExists(db, fromTable)) {
    db.exec(`ALTER TABLE ${fromTable} RENAME TO ${toTable}`);
  }
}

function usersTableNeedsMigration(db: Database.Database) {
  return tableExists(db, "users") && !hasColumn(db, "users", "id");
}

function migrateUsersSchema(db: Database.Database) {
  if (!usersTableNeedsMigration(db)) {
    return;
  }

  db.exec("PRAGMA foreign_keys = OFF");

  const transaction = db.transaction(() => {
    const legacyUsers = "users_legacy_pre_user_id_migration";
    const legacySessions = "sessions_legacy_pre_user_id_migration";
    const legacyUserSettings = "user_settings_legacy_pre_user_id_migration";
    const legacyWeeklyPlans = "weekly_plans_legacy_pre_user_id_migration";
    const legacyDailyPlans = "daily_plans_legacy_pre_user_id_migration";
    const legacyMeals = "meals_legacy_pre_user_id_migration";

    for (const tableName of [
      legacyMeals,
      legacyDailyPlans,
      legacyWeeklyPlans,
      legacyUserSettings,
      legacySessions,
      legacyUsers,
    ]) {
      dropTableIfExists(db, tableName);
    }

    renameTableIfExists(db, "meals", legacyMeals);
    renameTableIfExists(db, "daily_plans", legacyDailyPlans);
    renameTableIfExists(db, "weekly_plans", legacyWeeklyPlans);
    renameTableIfExists(db, "user_settings", legacyUserSettings);
    renameTableIfExists(db, "sessions", legacySessions);
    renameTableIfExists(db, "users", legacyUsers);

    createCoreTables(db);
    createUserSettingsTable(db);
    createPlanningTables(db);

    if (tableExists(db, legacyUsers)) {
      type LegacyUserRow = {
        id?: number;
        rowid?: number;
        email?: string | null;
        display_name?: string | null;
        verified_at?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        last_login_at?: string | null;
      };

      const rows = db
        .prepare(`SELECT rowid, * FROM ${legacyUsers}`)
        .all() as LegacyUserRow[];

      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (
          id,
          email,
          display_name,
          verified_at,
          created_at,
          updated_at,
          last_login_at
        ) VALUES (
          @id,
          @email,
          @displayName,
          @verifiedAt,
          @createdAt,
          @updatedAt,
          @lastLoginAt
        )
      `);

      for (const row of rows) {
        const legacyId = row.id ?? row.rowid ?? 1;
        const createdAt = row.created_at ?? timestamp();
        insertUser.run({
          id: legacyId,
          email: row.email ?? null,
          displayName: row.display_name ?? null,
          verifiedAt: row.verified_at ?? null,
          createdAt,
          updatedAt: row.updated_at ?? createdAt,
          lastLoginAt: row.last_login_at ?? null,
        });
      }
    }

    ensureLegacyUser(db);

    if (tableExists(db, legacySessions)) {
      const requiredColumns = ["user_id", "token_hash", "expires_at"];
      if (requiredColumns.every((columnName) => hasColumn(db, legacySessions, columnName))) {
        db.prepare(`
          INSERT OR IGNORE INTO sessions (
            id,
            user_id,
            token_hash,
            expires_at,
            created_at,
            last_seen_at,
            user_agent
          )
          SELECT
            rowid,
            COALESCE(user_id, 1),
            token_hash,
            expires_at,
            COALESCE(created_at, CURRENT_TIMESTAMP),
            COALESCE(last_seen_at, COALESCE(created_at, CURRENT_TIMESTAMP)),
            user_agent
          FROM ${legacySessions}
        `).run();
      }
    }

    if (tableExists(db, legacyUserSettings)) {
      const hasLegacyUserId = hasColumn(db, legacyUserSettings, "user_id");
      const hasLegacyId = hasColumn(db, legacyUserSettings, "id");

      if (hasLegacyUserId || hasLegacyId) {
        db.prepare(`
          INSERT OR IGNORE INTO user_settings (
            user_id,
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
          )
          SELECT
            ${hasLegacyUserId ? "COALESCE(user_id, 1)" : "1"},
            calorie_target,
            macro_carbs_pct,
            macro_fat_pct,
            macro_protein_pct,
            meals_per_day,
            COALESCE(gluten_free_only, 1),
            COALESCE(vegetarian, 0),
            COALESCE(reduce_meat, 0),
            COALESCE(vegetarian_share_pct, 40),
            COALESCE(fish_share_pct, 20),
            COALESCE(meat_share_pct, 40),
            COALESCE(excluded_ingredients_json, '[]'),
            COALESCE(max_recipe_repeats_per_week, 2),
            COALESCE(created_at, CURRENT_TIMESTAMP),
            COALESCE(updated_at, COALESCE(created_at, CURRENT_TIMESTAMP))
          FROM ${legacyUserSettings}
        `).run();
      }
    }

    if (tableExists(db, legacyWeeklyPlans)) {
      const hasLegacyUserId = hasColumn(db, legacyWeeklyPlans, "user_id");
      db.prepare(`
        INSERT OR IGNORE INTO weekly_plans (
          id,
          user_id,
          start_date,
          end_date,
          created_at,
          generated_by
        )
        SELECT
          rowid,
          ${hasLegacyUserId ? "COALESCE(user_id, 1)" : "1"},
          start_date,
          end_date,
          COALESCE(created_at, CURRENT_TIMESTAMP),
          COALESCE(generated_by, 'migration')
        FROM ${legacyWeeklyPlans}
      `).run();
    }

    if (tableExists(db, legacyDailyPlans)) {
      db.prepare(`
        INSERT OR IGNORE INTO daily_plans (
          id,
          weekly_plan_id,
          date,
          total_calories,
          total_protein_g,
          total_carbs_g,
          total_fat_g,
          score
        )
        SELECT
          rowid,
          weekly_plan_id,
          date,
          total_calories,
          total_protein_g,
          total_carbs_g,
          total_fat_g,
          score
        FROM ${legacyDailyPlans}
      `).run();
    }

    if (tableExists(db, legacyMeals)) {
      db.prepare(`
        INSERT OR IGNORE INTO meals (
          id,
          daily_plan_id,
          recipe_id,
          meal_type,
          portion_factor
        )
        SELECT
          rowid,
          daily_plan_id,
          recipe_id,
          meal_type,
          portion_factor
        FROM ${legacyMeals}
      `).run();
    }
  });

  transaction();
  db.exec("PRAGMA foreign_keys = ON");
}

function ensureLegacyUser(db: Database.Database, createdAt = timestamp()) {
  db.prepare(`
    INSERT OR IGNORE INTO users (
      id,
      email,
      display_name,
      verified_at,
      created_at,
      updated_at,
      last_login_at
    ) VALUES (
      1,
      NULL,
      'Lokaler Bestand',
      NULL,
      @createdAt,
      @updatedAt,
      NULL
    )
  `).run({
    createdAt,
    updatedAt: createdAt,
  });
}

function migrateUserSettingsSchema(db: Database.Database) {
  if (!tableExists(db, "user_settings")) {
    createUserSettingsTable(db);
    return;
  }

  if (hasColumn(db, "user_settings", "user_id")) {
    return;
  }

  db.exec("PRAGMA foreign_keys = OFF");

  const transaction = db.transaction(() => {
    if (tableExists(db, "user_settings_legacy")) {
      db.exec("DROP TABLE user_settings_legacy");
    }

    db.exec("ALTER TABLE user_settings RENAME TO user_settings_legacy");
    createUserSettingsTable(db);

    const legacyRow = db.prepare("SELECT * FROM user_settings_legacy WHERE id = 1").get() as
      | {
          calorie_target: number;
          macro_carbs_pct: number;
          macro_fat_pct: number;
          macro_protein_pct: number;
          meals_per_day: number;
          gluten_free_only: number;
          vegetarian: number;
          reduce_meat: number;
          vegetarian_share_pct?: number;
          fish_share_pct?: number;
          meat_share_pct?: number;
          excluded_ingredients_json: string;
          max_recipe_repeats_per_week: number;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (!legacyRow) {
      return;
    }

    ensureLegacyUser(db, legacyRow.created_at ?? timestamp());

    db.prepare(`
      INSERT INTO user_settings (
        user_id,
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
        @calorieTarget,
        @macroCarbsPct,
        @macroFatPct,
        @macroProteinPct,
        @mealsPerDay,
        @glutenFreeOnly,
        @vegetarian,
        @reduceMeat,
        @vegetarianSharePct,
        @fishSharePct,
        @meatSharePct,
        @excludedIngredientsJson,
        @maxRecipeRepeatsPerWeek,
        @createdAt,
        @updatedAt
      )
    `).run({
      calorieTarget: legacyRow.calorie_target,
      macroCarbsPct: legacyRow.macro_carbs_pct,
      macroFatPct: legacyRow.macro_fat_pct,
      macroProteinPct: legacyRow.macro_protein_pct,
      mealsPerDay: legacyRow.meals_per_day,
      glutenFreeOnly: legacyRow.gluten_free_only,
      vegetarian: legacyRow.vegetarian,
      reduceMeat: legacyRow.reduce_meat,
      vegetarianSharePct:
        legacyRow.vegetarian_share_pct ??
        (legacyRow.vegetarian === 1
          ? 100
          : legacyRow.reduce_meat === 1
            ? 45
            : DEFAULT_RECIPE_MIX.vegetarianSharePct),
      fishSharePct:
        legacyRow.fish_share_pct ??
        (legacyRow.vegetarian === 1
          ? 0
          : legacyRow.reduce_meat === 1
            ? 20
            : DEFAULT_RECIPE_MIX.fishSharePct),
      meatSharePct:
        legacyRow.meat_share_pct ??
        (legacyRow.vegetarian === 1
          ? 0
          : legacyRow.reduce_meat === 1
            ? 35
            : DEFAULT_RECIPE_MIX.meatSharePct),
      excludedIngredientsJson: legacyRow.excluded_ingredients_json,
      maxRecipeRepeatsPerWeek: legacyRow.max_recipe_repeats_per_week,
      createdAt: legacyRow.created_at ?? timestamp(),
      updatedAt: legacyRow.updated_at ?? timestamp(),
    });
  });

  transaction();
  db.exec("PRAGMA foreign_keys = ON");
}

function planningTablesNeedMigration(db: Database.Database) {
  const weeklySql = getTableSql(db, "weekly_plans");
  const dailySql = getTableSql(db, "daily_plans");
  const mealsSql = getTableSql(db, "meals");

  if (!weeklySql || !dailySql || !mealsSql) {
    return true;
  }

  return (
    !weeklySql.includes("UNIQUE(user_id, start_date)") ||
    !dailySql.includes("UNIQUE(weekly_plan_id, date)") ||
    !weeklySql.includes("FOREIGN KEY (user_id)")
  );
}

function migratePlanningSchema(db: Database.Database) {
  if (!planningTablesNeedMigration(db)) {
    return;
  }

  if (!tableExists(db, "weekly_plans") && !tableExists(db, "daily_plans") && !tableExists(db, "meals")) {
    createPlanningTables(db);
    return;
  }

  db.exec("PRAGMA foreign_keys = OFF");

  const transaction = db.transaction(() => {
    if (tableExists(db, "meals_legacy")) {
      db.exec("DROP TABLE meals_legacy");
    }
    if (tableExists(db, "daily_plans_legacy")) {
      db.exec("DROP TABLE daily_plans_legacy");
    }
    if (tableExists(db, "weekly_plans_legacy")) {
      db.exec("DROP TABLE weekly_plans_legacy");
    }

    if (tableExists(db, "meals")) {
      db.exec("ALTER TABLE meals RENAME TO meals_legacy");
    }
    if (tableExists(db, "daily_plans")) {
      db.exec("ALTER TABLE daily_plans RENAME TO daily_plans_legacy");
    }
    if (tableExists(db, "weekly_plans")) {
      db.exec("ALTER TABLE weekly_plans RENAME TO weekly_plans_legacy");
    }

    createPlanningTables(db);

    if (tableExists(db, "weekly_plans_legacy")) {
      const legacyPlanCount = (
        db.prepare("SELECT COUNT(*) AS count FROM weekly_plans_legacy").get() as { count: number }
      ).count;

      if (legacyPlanCount > 0) {
        ensureLegacyUser(db);

        db.prepare(`
          INSERT INTO weekly_plans (
            id,
            user_id,
            start_date,
            end_date,
            created_at,
            generated_by
          )
          SELECT
            id,
            COALESCE(user_id, 1),
            start_date,
            end_date,
            created_at,
            generated_by
          FROM weekly_plans_legacy
        `).run();

        db.prepare(`
          INSERT INTO daily_plans (
            id,
            weekly_plan_id,
            date,
            total_calories,
            total_protein_g,
            total_carbs_g,
            total_fat_g,
            score
          )
          SELECT
            id,
            weekly_plan_id,
            date,
            total_calories,
            total_protein_g,
            total_carbs_g,
            total_fat_g,
            score
          FROM daily_plans_legacy
        `).run();

        db.prepare(`
          INSERT INTO meals (
            id,
            daily_plan_id,
            recipe_id,
            meal_type,
            portion_factor
          )
          SELECT
            id,
            daily_plan_id,
            recipe_id,
            meal_type,
            portion_factor
          FROM meals_legacy
        `).run();
      }
    }
  });

  transaction();
  db.exec("PRAGMA foreign_keys = ON");
}

function seedDefaults(db: Database.Database) {
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
    createCoreTables(dbInstance);
    migrateUsersSchema(dbInstance);
    migrateUserSettingsSchema(dbInstance);
    migratePlanningSchema(dbInstance);
    createUserSettingsTable(dbInstance);
    createPlanningTables(dbInstance);
    seedDefaults(dbInstance);
  }

  return dbInstance;
}
