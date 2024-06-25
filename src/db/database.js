import { MongoClient } from "mongodb";
import { DATABASE_NAME_WUWE, DATABASE_NAME_GRANDCHASE } from "../utils/constants.js";

import logger from "../utils/log.js";
let log = logger(import.meta.filename);

const uri = process.env.db_uri;

// The MongoClient is the object that references the connection to our
// datastore (Atlas, for example)
class Connections {
    database = null;
    client = null;
    collection = null;
    query = null;
    options = null;
    collectionNm = null;
    data = null;
    constructor() {
        if (!this.client) {
            // log.info('client not found');
            this.client = new MongoClient(uri);
        }
    }

    setQuery(query) {
        this.query = query;
        return this;
    }

    setOptions(options) {
        this.options = options;
        return this;
    }

    setData(data) {
        this.data = data;
        return this;
    }

    connectGC(collectionNm) {
        this.collectionNm = collectionNm;
        this.database = this.client.db(DATABASE_NAME_GRANDCHASE);
        this.collection = this.database.collection(this.collectionNm);
        return this;
    }

    connectWuwa(collectionNm) {
        this.collectionNm = collectionNm;
        this.database = this.client.db(DATABASE_NAME_WUWE);
        this.collection = this.database.collection(this.collectionNm);
        return this;
    }

    async findAll() {
        try {
            const dataManyResult = await this.collection.find().toArray();
            log.info(`Documents successfully select data ${this.collectionNm}.`);
            return dataManyResult;
        } catch (err) {
            log.error(`Something went wrong trying to select the ${this.collectionNm}: ${err}`);
        }
    }

    async findOne() {
        try {
            const dataManyResult = await this.collection.findOne(this.query);
            return dataManyResult;
        } catch (err) {
            log.error(`Something went wrong trying to select the ${this.collectionNm}: ${err}`);
        }
    }

    async findByCondition() {
        try {
            const dataManyResult = this.collection.find(this.query).toArray();
            log.info(`Documents successfully select data ${this.collectionNm}.`);
            return dataManyResult;
        } catch (err) {
            log.error(`Something went wrong trying to select the ${this.collectionNm}: ${err}`);
        }
    }

    async updateOneData() {
        try {
            const dataManyResult = await this.collection.updateOne(this.query, this.data, this.options);
            return dataManyResult;
        } catch (err) {
            log.error(`Something went wrong trying to update the ${this.collectionNm}: ${err}`);
        }
    }

    async insertManyData() {
        try {
            const insertManyResult = await this.collection.insertMany(this.data);
            log.info(`${insertManyResult.insertedCount} documents successfully inserted ${this.collectionNm}.`);
        } catch (err) {
            log.error(`Something went wrong trying to insert the new ${this.collectionNm}: ${err}`);
        }
    }

    async insertOneData() {
        try {
            await this.collection.insertOne(this.data);
            log.info(`Documents successfully inserted ${this.collectionNm}.`);
        } catch (err) {
            log.error(`Something went wrong trying to insert the new ${this.collectionNm}: ${err}`);
        }
    }

    async dropAndInsert() {
        try {
            await this.collection.drop();
            log.info(`Documents successfully dropped ${this.collectionNm}.`);
            await this.insertManyData();
        } catch (err) {
            log.error(`Something went wrong trying to drop the ${this.collectionNm}: ${err}`);
        }
    }
}

export { Connections }