import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord.js";
import {
  COLLECTION_HSR_CHANNEL,
  COLLECTION_HSR_ACCOUNT,
} from "../../../utils/constants.js";

import logger from "../../../utils/log.js";
import ConnectionHSR from "../../../db/databaseHSR.js";
import { getAccountRegion } from "../../../utils/utils.js";
const log = logger(import.meta.filename);

const connection = new ConnectionHSR();

const data = new SlashCommandBuilder()
  .setName("hsr")
  .setDescription("Wuthering News Command!")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add account HSR")
      .addStringOption((option) =>
        option.setName("uid").setDescription("Add uid HSR").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("ltoken_v2")
          .setDescription("Cookie token in hoyoverse.")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("ltuid_v2")
          .setDescription("Cookie token in hoyoverse.")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setting")
      .setDescription("Enable/Disable account HSR")
      .addStringOption((option) =>
        option.setName("uid").setDescription("Add uid HSR").setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("enable")
          .setDescription(
            "Enable/Disable the bot to send news on 1 time / 1 hour.",
          )
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("schedule")
      .setDescription("choose date and channel (optional)")
      .addBooleanOption((option) =>
        option
          .setName("enable")
          .setDescription(
            "Enable/Disable the bot to send news on 1 time / 1 hour.",
          )
          .setRequired(true),
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel the message should be sent to.")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false),
      ),
  );

const validate = async () => {
  return true;
};

const execute = async (interaction) => {
  try {
    // const schedule = interaction.options.getChannel('schedule');
    //await interaction.reply({ ephemeral: false, content: 'Waiting', fetchReply: true });
    const subcommand = interaction.options.getSubcommand();
    const channel =
      interaction.options.getChannel("channel") ?? interaction.channel;

    if (subcommand === "schedule") {
      const enabled = interaction.options.getBoolean("enable");
      await createChannel(interaction, channel, enabled);
      const content = enabled
        ? "Schedule added! Bot will check and add redeem new code."
        : `Schedule of channel (${channel.name}) removed!`;
      await interaction.editReply({
        ephemeral: false,
        content: content,
        fetchReply: true,
      });
    } else if (subcommand === "add") {
      const uid = interaction.options.getString("uid");
      const ltoken_v2 = interaction.options.getString("ltoken_v2");
      const ltuid_v2 = interaction.options.getString("ltuid_v2");
      const account = {
        uid,
        ltoken_v2,
        ltuid_v2,
      };
      await createNewAccount(account);
      await interaction.editReply({
        ephemeral: false,
        content: "account added",
        fetchReply: true,
      });
    } else if (subcommand === "setting") {
      const uid = interaction.options.getString("uid");
      const enabled = interaction.options.getBoolean("enable");
      const account = {
        uid,
        enabled,
      };
      await removeAccount(account);
      await interaction.editReply({
        ephemeral: false,
        content: "account updated",
        fetchReply: true,
      });
    }
  } catch (e) {
    log.error(`Error execute wuwa news: ${e}`);
  }
};

const createChannel = async (interaction, channel, enabled) => {
  const query = { id: channel.id };
  const data = {
    $set: {
      id: channel.id,
      name: channel.name,
      guild: { id: interaction.guild.id, name: interaction.guild.name },
      enabled: enabled,
    },
  };
  const options = { upsert: true };
  // await updateOneData(COLLECTION_WUWE_CHANNEL, DATABASE_NAME_WUWE, query, data, options);
  await connection
    .setQuery(query)
    .setData(data)
    .setOptions(options)
    .setCollection(COLLECTION_HSR_CHANNEL)
    .updateOneData();
};

const removeAccount = async (account) => {
  const query = { uid: account.uid };
  const data = {
    $set: {
      uid: account.uid,
      enabled: account.enabled,
    },
  };
  const options = { upsert: true };
  await connection
    .setQuery(query)
    .setData(data)
    .setOptions(options)
    .setCollection(COLLECTION_HSR_ACCOUNT)
    .updateOneData();
};

const createNewAccount = async (account) => {
  const query = { uid: account.uid };
  const data = {
    $set: {
      uid: account.uid,
      region: getAccountRegion(account.uid),
      cookie: `ltoken_v2=${account.ltoken_v2}; ltuid_v2=${account.ltuid_v2};`,
      enabled: true,
    },
  };
  const options = { upsert: true };
  await connection
    .setQuery(query)
    .setData(data)
    .setOptions(options)
    .setCollection(COLLECTION_HSR_ACCOUNT)
    .updateOneData();
};

const devOnly = false;

export { data, validate, execute, devOnly };
