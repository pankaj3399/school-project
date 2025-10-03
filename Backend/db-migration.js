import mongoose from "mongoose";

// ========================================
// DATABASE MIGRATION CONFIGURATION
// ========================================
// Edit these URLs to match your source and destination databases
const SOURCE_DB_URL = "src";
const DESTINATION_DB_URL = "dest";

// Migration settings
const BATCH_SIZE = 1000;
const SKIP_EXISTING = true;
const LOG_PROGRESS = true;

// ========================================
// DATABASE MIGRATION SCRIPT
// ========================================

class DatabaseMigrator {
  constructor() {
    this.sourceConnection = null;
    this.destinationConnection = null;
    this.stats = {
      totalCollections: 0,
      migratedCollections: 0,
      totalDocuments: 0,
      migratedDocuments: 0,
      skippedDocuments: 0,
      errors: [],
    };
  }

  async connect() {
    try {
      console.log("🔗 Connecting to databases...");
      this.sourceConnection = await mongoose
        .createConnection(SOURCE_DB_URL)
        .asPromise();
      console.log("✅ Connected to source database");

      this.destinationConnection = await mongoose
        .createConnection(DESTINATION_DB_URL)
        .asPromise();
      console.log("✅ Connected to destination database");
    } catch (error) {
      console.error("❌ Connection failed:", error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.sourceConnection) await this.sourceConnection.close();
      if (this.destinationConnection) await this.destinationConnection.close();
      console.log("🔌 Disconnected from databases");
    } catch (error) {
      console.error("❌ Disconnect error:", error.message);
    }
  }

  async getCollections() {
    const collections = await this.sourceConnection.db
      .listCollections()
      .toArray();
    return collections
      .map((col) => col.name)
      .filter((name) => !name.startsWith("system."));
  }

  async migrateCollection(collectionName) {
    try {
      console.log(`\n📋 Migrating collection: ${collectionName}`);

      const sourceCollection =
        this.sourceConnection.db.collection(collectionName);
      const destinationCollection =
        this.destinationConnection.db.collection(collectionName);

      const totalCount = await sourceCollection.countDocuments();
      this.stats.totalDocuments += totalCount;

      if (totalCount === 0) {
        console.log(`⚠️  Collection ${collectionName} is empty, skipping...`);
        return;
      }

      console.log(`📊 Total documents to migrate: ${totalCount}`);

      let migratedCount = 0;
      let skippedCount = 0;
      let cursor = sourceCollection.find({});

      while (await cursor.hasNext()) {
        const batch = [];

        for (let i = 0; i < BATCH_SIZE && (await cursor.hasNext()); i++) {
          batch.push(await cursor.next());
        }

        if (batch.length === 0) break;

        try {
          if (SKIP_EXISTING) {
            const existingIds = await destinationCollection
              .find(
                { _id: { $in: batch.map((doc) => doc._id) } },
                { projection: { _id: 1 } },
              )
              .toArray();

            const existingIdSet = new Set(
              existingIds.map((doc) => doc._id.toString()),
            );
            const newDocuments = batch.filter(
              (doc) => !existingIdSet.has(doc._id.toString()),
            );

            if (newDocuments.length > 0) {
              await destinationCollection.insertMany(newDocuments, {
                ordered: false,
              });
              migratedCount += newDocuments.length;
            }

            skippedCount += batch.length - newDocuments.length;
          } else {
            await destinationCollection.insertMany(batch, { ordered: false });
            migratedCount += batch.length;
          }

          if (LOG_PROGRESS && (migratedCount + skippedCount) % 1000 === 0) {
            console.log(
              `📈 Progress: ${
                migratedCount + skippedCount
              }/${totalCount} documents`,
            );
          }
        } catch (error) {
          console.error(`❌ Batch error for ${collectionName}:`, error.message);
          this.stats.errors.push({
            collection: collectionName,
            error: error.message,
          });
        }
      }

      this.stats.migratedDocuments += migratedCount;
      this.stats.skippedDocuments += skippedCount;

      console.log(
        `✅ ${collectionName} completed: ${migratedCount} migrated, ${skippedCount} skipped`,
      );
    } catch (error) {
      console.error(`❌ Error migrating ${collectionName}:`, error.message);
      this.stats.errors.push({
        collection: collectionName,
        error: error.message,
      });
    }
  }

  async migrateIndexes(collectionName) {
    try {
      const sourceCollection =
        this.sourceConnection.db.collection(collectionName);
      const destinationCollection =
        this.destinationConnection.db.collection(collectionName);

      const indexes = await sourceCollection.indexes();
      const customIndexes = indexes.filter((index) => index.name !== "_id_");

      if (customIndexes.length === 0) return;

      console.log(
        `🗂️  Migrating ${customIndexes.length} indexes for ${collectionName}...`,
      );

      for (const index of customIndexes) {
        try {
          const indexSpec = { ...index.key };
          const indexOptions = { ...index };
          delete indexOptions.v;
          delete indexOptions.key;
          delete indexOptions.ns;

          await destinationCollection.createIndex(indexSpec, indexOptions);
        } catch (error) {
          if (!error.message.includes("already exists")) {
            console.error(`❌ Index error ${index.name}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(
        `❌ Index migration error for ${collectionName}:`,
        error.message,
      );
    }
  }

  async migrate() {
    console.log("🚀 Starting database migration...\n");
    console.log(`📂 Source: ${SOURCE_DB_URL}`);
    console.log(`📁 Destination: ${DESTINATION_DB_URL}\n`);

    try {
      await this.connect();

      const collections = await this.getCollections();
      this.stats.totalCollections = collections.length;

      console.log(`📚 Found ${collections.length} collections:`);
      collections.forEach((col) => console.log(`   - ${col}`));

      for (const collectionName of collections) {
        await this.migrateCollection(collectionName);
        await this.migrateIndexes(collectionName);
        this.stats.migratedCollections++;
      }

      this.printSummary();
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  printSummary() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(
      `Collections: ${this.stats.migratedCollections}/${this.stats.totalCollections}`,
    );
    console.log(
      `Documents: ${this.stats.migratedDocuments}/${this.stats.totalDocuments}`,
    );
    console.log(`Skipped: ${this.stats.skippedDocuments}`);
    console.log(`Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.stats.errors.forEach((error, index) => {
        console.log(
          `${index + 1}. Collection: ${error.collection} - ${error.error}`,
        );
      });
    }

    console.log("\n✅ Migration completed!");
  }
}

// ========================================
// RUN MIGRATION
// ========================================

async function runMigration() {
  console.log("🎯 Database Migration Tool");
  console.log("==========================\n");

  // Validation
  if (SOURCE_DB_URL === "mongodb://localhost:27017/source_database_name") {
    console.log("❌ Please update SOURCE_DB_URL in the script");
    return;
  }

  if (
    DESTINATION_DB_URL === "mongodb://localhost:27017/destination_database_name"
  ) {
    console.log("❌ Please update DESTINATION_DB_URL in the script");
    return;
  }

  if (SOURCE_DB_URL === DESTINATION_DB_URL) {
    console.log("❌ Source and destination URLs cannot be the same");
    return;
  }

  const migrator = new DatabaseMigrator();

  try {
    await migrator.migrate();
  } catch (error) {
    console.error("💥 Migration failed:", error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();
