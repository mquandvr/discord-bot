import mongoose from "mongoose";

const Schema = mongoose.Schema;

const WuwaHeroSchema = new Schema({
  name: String,
  value: String,
  attribute: String,
  weapon: String,
  rarity: Number,
  note: String,
  updated: Date,
});

export const WuwaHeroModel = mongoose.model("hero", WuwaHeroSchema);
