import { MongoClient } from "mongodb";
import { COLLECTION_ATTRIBUTE, COLLECTION_CLASS, COLLECTION_HERO, COLLECTION_META, COLLECTION_TIER, COLLECTION_WUWE_NEWS, DATABASE_NAME_GRANDCHASE, DATABASE_NAME_WUWE } from "./utils/constants.js";

const uri = process.env.db_uri;

// The MongoClient is the object that references the connection to our
// datastore (Atlas, for example)
const client = new MongoClient(uri);

async function run(dbName) {
    try {
        console.log("connect database");

        // The connect() method does not attempt a connection; instead it instructs
        // the driver to connect using the settings provided when a connection
        // is required.
        await client.connect();

        // Provide the name of the database and collection you want to use.
        // If the database and/or collection do not exist, the driver and Atlas
        // will create them automatically when you first write data.
        // const dbName = "grandchase";
        const database = client.db(dbName);

        console.log("connect success");
        return database;
    } catch (e) {
        console.log("Error connect", e);
    }
}

async function init(data) {
    try {
        const database = await run(DATABASE_NAME_GRANDCHASE);
        await dropCollection(COLLECTION_META, DATABASE_NAME_GRANDCHASE, database);
        await insertManyData(COLLECTION_META, data.gc.meta, DATABASE_NAME_GRANDCHASE, database);
    
        await dropCollection(COLLECTION_ATTRIBUTE, DATABASE_NAME_GRANDCHASE, database);
        await insertManyData(COLLECTION_ATTRIBUTE, data.gc.attribute, DATABASE_NAME_GRANDCHASE, database);
    
        await dropCollection(COLLECTION_CLASS, DATABASE_NAME_GRANDCHASE, database);
        await insertManyData(COLLECTION_CLASS, data.gc.class, DATABASE_NAME_GRANDCHASE, database);
    
        await dropCollection(COLLECTION_HERO, DATABASE_NAME_GRANDCHASE, database);
        await insertManyData(COLLECTION_HERO, data.gc.hero, DATABASE_NAME_GRANDCHASE, database);
    
        await dropCollection(COLLECTION_TIER, DATABASE_NAME_GRANDCHASE, database);
        await insertManyData(COLLECTION_TIER, data.gc.tier, DATABASE_NAME_GRANDCHASE, database);
    
        // await dropCollection(database, COLLECTION_WUWE_NEWS);
        const dataWuwe = await findAll(COLLECTION_WUWE_NEWS, DATABASE_NAME_WUWE);
        if (!dataWuwe || dataWuwe.length === 0) {
            await insertOneData(COLLECTION_WUWE_NEWS, {articleId: 0}, DATABASE_NAME_WUWE);
        }
    
        await dropCollection(COLLECTION_HERO, DATABASE_NAME_WUWE, database);
        await insertManyData(COLLECTION_HERO, data.ww.hero, DATABASE_NAME_WUWE, database);
    } catch(e) {
        console.log(e);
    } finally {
        client.close();
    }
}

async function dropCollection(collectionName, dbName, database) {
    try {
        if (!database) {
            database = await run(dbName);
        }
        const collection = database.collection(collectionName);
        await collection.drop();
        console.log(`Documents successfully dropped ${collectionName}.\n`);
    } catch (err) {
        console.error(`Something went wrong trying to drop the ${collectionName}: ${err}\n`);
    }
}


async function insertManyData(collectionName, data, dbName, database) {
    try {
        if (!database) {
            database = await run(dbName);
        }
        const collection = database.collection(collectionName);
        const insertManyResult = await collection.insertMany(data);
        console.log(`${insertManyResult.insertedCount} documents successfully inserted ${collectionName}.\n`);
    } catch (err) {
        console.error(`Something went wrong trying to insert the new ${collectionName}: ${err}\n`);
    }
}


async function insertOneData(collectionName, data, dbName, database) {
    try {
        if (!database) {
            database = await run(dbName)
        }
        const collection = database.collection(collectionName);
        await collection.insertOne(data);
        console.log(`Documents successfully inserted ${collectionName}.\n`);
    } catch (err) {
        console.error(`Something went wrong trying to insert the new ${collectionName}: ${err}\n`);
    }
}

async function findAll(collectionName, dbName, database) {
    try {
        if (!database) {
            database = await run(dbName);
        }
        const collection = database.collection(collectionName);
        const dataManyResult = await collection.find().toArray();
        return dataManyResult;
    } catch (err) {
        console.error(`Something went wrong trying to select the ${collectionName}: ${err}\n`);
    }
}

async function findByCondition(collectionName, query, dbName, database) {
    try {
        if (!database) {
            database = await run(dbName);
        }
        const collection = database.collection(collectionName);
        const dataManyResult = collection.find(query).toArray();
        return dataManyResult;
    } catch (err) {
        console.error(`Something went wrong trying to select the ${collectionName}: ${err}\n`);
    }
}

async function findOne(collectionName, query, dbName, database) {
    try {
        if (!database) {
            database = await run(dbName);
        }
        const collection = database.collection(collectionName);
        const dataManyResult = collection.findOne(query);
        return dataManyResult;
    } catch (err) {
        console.error(`Something went wrong trying to select the ${collectionName}: ${err}\n`);
    }
}

export { run, init, findAll, findByCondition, findOne, insertOneData }