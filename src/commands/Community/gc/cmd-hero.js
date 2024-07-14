import { SlashCommandBuilder } from "@discordjs/builders";
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  formatEmoji,
  blockQuote,
  codeBlock,
} from "discord.js";
import * as Table from "../../../utils/table.js";
import { convertDateToTimetamp } from "../../../utils/date.js";
import {
  COLLECTION_GC_ATTRIBUTE,
  COLLECTION_GC_CLASS,
  COLLECTION_GC_HERO,
  COLLECTION_GC_TIER,
} from "../../../utils/constants.js";

import logger from "../../../utils/log.js";
import ConnectionGC from "../../../db/databaseGC.js";
const log = logger(import.meta.filename);

const domainName = process.env.domain;

const connection = new ConnectionGC();

const data = new SlashCommandBuilder()
  .setName("gc-hero")
  .setDescription("Grandchase Hero Build Command!")
  .addStringOption((option) =>
    option
      .setName("hero")
      .setDescription("The hero category")
      .setRequired(true)
      .setAutocomplete(true),
  );

const autocomplete = async (interaction) => {
  try {
    const focusedValue = interaction.options.getFocused();
    const heros = await connection.setCollection(COLLECTION_GC_HERO).findAll();
    log.info("heros %s", heros.length);
    const fileterChoices = heros.filter((hero) =>
      hero.name?.toLowerCase()?.startsWith(focusedValue?.toLowerCase()),
    );
    const results = fileterChoices.map((choice, index) => {
      return {
        name: choice.name,
        value: choice.value ?? `v${index}`,
      };
    });
    await interaction.respond(results?.slice(0, 25));
  } catch (e) {
    log.error(e);
    const results = [
      {
        name: "Data not Found",
        value: `dt`,
      },
    ];
    await interaction.respond(results);
  }
};

const validate = async () => {
  return true;
};

const execute = async (interaction) => {
  try {
    const heroValue = interaction.options.getString("hero");
    log.info("hero %s", heroValue);

    // const heroData = await findOne(COLLECTION_HERO, {value: heroValue}, DATABASE_NAME_GRANDCHASE);
    const heroData = await connection
      .setQuery({ value: heroValue })
      .setCollection(COLLECTION_GC_HERO)
      .findOne();
    // const heroData = heros.find(h => h.value === heroValue);

    if (!heroValue || !heroData) {
      return await interaction.editReply({
        ephemeral: true,
        content: "Hero not found!",
      });
    }

    // let fileNames = [];
    // try {
    //     fileNames = fs.readdirSync(`./assets/${heroData.value}`).filter(file => file.endsWith(".jpg"));
    // } catch (e) {
    //     log.warn("File image not found!");
    //     fileNames = [];
    // }

    // const attributeData = await findOne(COLLECTION_ATTRIBUTE, {id: heroData.attribute}, DATABASE_NAME_GRANDCHASE);
    // const clazzData = await findOne(COLLECTION_CLASS, {id: heroData.clazz}, DATABASE_NAME_GRANDCHASE);
    const attributeData = await connection
      .setQuery({ id: heroData.attribute })
      .setCollection(COLLECTION_GC_ATTRIBUTE)
      .findOne();
    const clazzData = await connection
      .setQuery({ id: heroData.clazz })
      .setCollection(COLLECTION_GC_CLASS)
      .findOne();
    const attribute = attributeData ? formatEmoji(attributeData.value) : "";
    const clazz = clazzData ? formatEmoji(clazzData.value) : "";
    const content = heroData.content ?? "PVE";

    // const fileImageData = await connection
    //     .setCollection(COLLECTION_GC_IMAGE)
    //     .findAll();
    let equipFileNames = [];
    let siFileNames = [];
    if (heroData.image) {
      const heroImages = heroData.image.split(",");
      equipFileNames = heroImages.filter((x) => x.indexOf("equip") >= 0);
      siFileNames = heroImages.filter((x) => x.indexOf("si") >= 0);
      // log.info("equipFileNames %s", equipFileNames);
      // log.info("siFileNames %s", siFileNames);
    }

    let template = {
      data: heroData,
      title: "Equipment Recommendation",
      clazz: clazz,
      attribute: attribute,
      content: content,
      fileNames: equipFileNames,
    };
    const equipEmbedArr = await createDataEmbeds(template);

    template = {
      data: heroData,
      title: "Soul Imprint Recommendation",
      clazz: clazz,
      attribute: attribute,
      content: content,
      fileNames: siFileNames,
    };
    const siEmbedArr = await createDataEmbeds(template);

    const equipmentBtn = new ButtonBuilder()
      .setCustomId("equipmentBtn")
      .setLabel("Equipment")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const siBtn = new ButtonBuilder()
      .setCustomId("siBtn")
      .setLabel("Soul Imprint")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(false);

    let row = new ActionRowBuilder().addComponents(equipmentBtn, siBtn);

    //const channel = client.channels.cache.get(interaction.channel.id);
    //await interaction.reply({ ephemeral: true, content: 'Loading...!' });
    //await channel.send({ embeds: embed, files: file });
    //await interaction.deleteReply();
    const response = await interaction.editReply({
      embeds: equipEmbedArr,
      components: [row],
    });
    //const collectorFilter = i => i.user.id === interaction.user.id;

    //const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });
    collector.on("collect", async (i) => {
      try {
        const selectedId = i.customId;
        log.info(`selected button: ${selectedId}`);
        const collectorFilter = (i) => i.user.id === interaction.user.id;
        if (collectorFilter) {
          if (selectedId === "equipmentBtn") {
            equipmentBtn.setDisabled(true).setStyle(ButtonStyle.Primary);
            siBtn.setDisabled(false).setStyle(ButtonStyle.Secondary);

            await i.update({ embeds: equipEmbedArr, components: [row] });
          } else if (selectedId === "siBtn") {
            equipmentBtn.setDisabled(false).setStyle(ButtonStyle.Secondary);
            siBtn.setDisabled(true).setStyle(ButtonStyle.Primary);

            await i.update({ embeds: siEmbedArr, components: [row] });
          }
        } else {
          await i.update({ components: [] });
        }
      } catch (e) {
        log.error(`Error selected button gc hero: ${e}`);
        await interaction.editReply({
          ephemeral: true,
          content: "Confirmation not received within 1 minute, cancelling",
          components: [],
        });
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({
          ephemeral: true,
          content: "Confirmation not received within 1 minute, cancelling",
          components: [],
        });
      } catch (e) {
        log.error(`Error end button gc hero: ${e}`);
      }
    });
  } catch (e) {
    log.error(`Error execute gc hero: ${e}`);
  }
};

const createDataEmbeds = async (template) => {
  const embedArr = [];
  const fileNames = template.fileNames;
  if (fileNames && fileNames.length > 0) {
    for (const [index, fileName] of fileNames.entries()) {
      const imagePath = `${domainName}/gc/${template.data.value}/${fileName.trim()}.jpg`;
      // log.info('imagePath %s', imagePath);
      template.imagePath = imagePath;
      const isLastRecord = index === fileNames.length - 1;
      const isHeaderRecord = index === 0;
      const embedTemplate = await createEmbedTemplate(
        template,
        isLastRecord,
        isHeaderRecord,
      );
      embedArr.push(embedTemplate);
    }
  } else {
    log.error("image not found");
  }

  return embedArr;
};

const createEmbedTemplate = async (template, isLastRecord, isHeaderRecord) => {
  //let fileImage = new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`);
  //file.push(new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`));
  //log.info(imagePath);
  const equipEmbed = new EmbedBuilder();
  if (isHeaderRecord) {
    const contentTable = await createContentTable(template.data.value);
    equipEmbed
      .setTitle(template.title)
      //.setThumbnail(`${domainName}/${template.data.value}/${template.icon}`)
      .addFields(
        {
          name: "Hero Name",
          value: `${template.data.name} ${template.clazz} ${template.attribute}`,
          inline: true,
        },
        { name: "Content", value: `${codeBlock(contentTable)}`, inline: false },
        {
          name: "Note",
          value: `${blockQuote(template.data.note ?? "Updating!")}`,
          inline: false,
        },
      );
  }
  //equipEmbeb.setImage(`attachment://${fileName}`)
  equipEmbed.setImage(template.imagePath);
  if (isLastRecord) {
    equipEmbed
      .setTimestamp(convertDateToTimetamp(template.data.updated))
      .setFooter({ text: "Last updated" });
  }
  return equipEmbed.setColor("Random");
};

const createContentTable = async (hero) => {
  // const tier = await findOne(COLLECTION_TIER, {hero: hero}, DATABASE_NAME_GRANDCHASE);
  const tier = await connection
    .setQuery({ hero: hero })
    .setCollection(COLLECTION_GC_TIER)
    .findOne();

  if (!tier) return "Updating!";

  const columns = [
    {
      width: 13,
      label: "Content",
      index: 0,
      field: "content",
    },
    {
      width: 15,
      label: "Phase",
      index: 1,
      field: "phase",
    },
    {
      width: 7,
      label: "Rank",
      index: 2,
      field: "rank",
    },
  ];
  const table = new Table.TableBuilder(columns);
  tier.data.forEach((t) => {
    table.addRows(t);
  });

  return table.build();
};

const devOnly = false;

export { data, validate, autocomplete, execute, devOnly };
