import mongoose from 'mongoose'

const SOURCE_URI = 'MONGO_SOURCE_URI';
const DEST_URI = 'MONGO_DESTINATION_URI';

async function cloneDatabase() {
  let sourceConn, destConn;
  try {
    console.log('Connecting to source database...');
    sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log('Connected to source database.');

    console.log('Connecting to destination database...');
    destConn = await mongoose.createConnection(DEST_URI).asPromise();
    console.log('Connected to destination database.');

    // Drop all collections in all databases in destination except system databases
    const adminDb = destConn.db.admin();
    const dbs = await adminDb.listDatabases();
    for (const dbInfo of dbs.databases) {
      const dbName = dbInfo.name;
      if (["admin", "local", "config"].includes(dbName)) continue;
      if (dbName !== destConn.name) {
        const tempConn = await mongoose.createConnection(DEST_URI.replace(destConn.name, dbName)).asPromise();
        await tempConn.dropDatabase();
        await tempConn.close();
        console.log(`Dropped database: ${dbName}`);
      }
    }
    // Drop all collections in the destination database
    const destCollections = await destConn.db.listCollections().toArray();
    for (const { name } of destCollections) {
      await destConn.dropCollection(name).catch(() => {});
      console.log(`Dropped destination collection: ${name}`);
    }
    console.log('All non-system databases and all collections dropped from destination.');

    const collections = await sourceConn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source.`);

    for (const { name } of collections) {
      console.log(`\nProcessing collection: ${name}`);
      const sourceCol = sourceConn.collection(name);
      const destCol = destConn.collection(name);

      const docs = await sourceCol.find({}).toArray();
      if (docs.length === 0) {
        await destConn.createCollection(name).catch(() => {});
        console.log('No documents to copy. Created empty collection in destination.');
        continue;
      }
      await destCol.insertMany(docs, { ordered: false });
      console.log(`Copied ${docs.length} documents to destination collection: ${name}`);
    }

    console.log('\nDatabase clone completed successfully!');
  } catch (err) {
    console.error('Error during cloning:', err);
  } finally {
    if (sourceConn) await sourceConn.close();
    if (destConn) await destConn.close();
    process.exit();
  }
}

cloneDatabase();
