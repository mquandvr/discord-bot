import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  bold,
  codeBlock,
  formatEmoji,
} from "discord.js";
import {
  COLLECTION_GC_ATTRIBUTE,
  COLLECTION_GC_CLASS,
  COLLECTION_GC_META,
} from "../../../utils/constants.js";

import logger from "../../../utils/log.js";
import ConnectionGC from "../../../db/databaseGC.js";
const log = logger(import.meta.filename);

const connection = new ConnectionGC();

// let metas = await import('../../data/meta.json', {assert: { type: "json" }});
// let classes = await import('../../data/class.json', {assert: { type: "json" }});
// let attributes = await import('../../data/attribute.json', {assert: { type: "json" }});

const MAX_RECORD_OF_PAGE = process.env.max_record_of_page ?? 6;

const data = new SlashCommandBuilder()
  .setName("gc-meta")
  .setDescription("Grandchase Hero Build Command!")
  .addStringOption((option) =>
    option
      .setName("content")
      .setDescription("Select a content")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option
      .setName("phase")
      .setDescription("Select a phase")
      .setRequired(false)
      .setAutocomplete(true),
  );

const autocomplete = async (interaction) => {
  try {
    const focusedValue = interaction.options.getFocused();
    let fileterChoices = [];
    let metaFileterChoices = [];

    const content = interaction.options.getString("content");
    const phase = interaction.options.getString("phase");
    // log.info("content", content);
    // log.info("phase", phase);

    const metas = await connection.setCollection(COLLECTION_GC_META).findAll();

    if (phase !== null) {
      metaFileterChoices = metas?.filter(
        (meta) => meta?.value?.toLowerCase() === content,
      );
      fileterChoices = metaFileterChoices[0]?.data.filter((data) =>
        data?.name?.toLowerCase().includes(focusedValue.toLowerCase()),
      );
    } else if (content !== null) {
      metaFileterChoices = metas?.filter((meta) =>
        meta?.name?.toLowerCase().includes(focusedValue.toLowerCase()),
      );
      fileterChoices = metaFileterChoices;
    }

    const results = fileterChoices?.map((choice, index) => {
      return {
        name: choice?.name ?? "Data not Found",
        value: choice?.value ?? `v${index}`,
      };
    });

    // log.info("results", results);
    await interaction.respond(results.slice(0, 25));
  } catch (e) {
    log.error(`Error autocomplete gc: ${e}`);
    const results = [
      {
        name: "Data not Found",
        value: `v0`,
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
    const contentValue = interaction.options.getString("content");
    const phaseValue = interaction.options.getString("phase");
    log.info("content %s phase %s", contentValue, phaseValue);

    let metaData = await connection
      .setQuery({ value: contentValue })
      .setCollection(COLLECTION_GC_META)
      .findOne();
    // let metaData = metas?.find(h => h?.value === contentValue);

    if (!contentValue || !metaData || !metaData.data)
      return await interaction.editReply({
        ephemeral: true,
        content: "Meta not found!",
      });

    let phaseDatas = metaData.data;
    if (phaseValue) {
      phaseDatas = [metaData.data?.find((p) => p.value === phaseValue)];
    }

    let content = "";
    const dataSlice =
      phaseDatas.length > MAX_RECORD_OF_PAGE
        ? phaseDatas.slice(0, MAX_RECORD_OF_PAGE)
        : phaseDatas;
    // const attributes = await findAll(COLLECTION_ATTRIBUTE, DATABASE_NAME_GRANDCHASE);
    // const classes = await findAll(COLLECTION_CLASS, DATABASE_NAME_GRANDCHASE);
    const attributes = await connection
      .setCollection(COLLECTION_GC_ATTRIBUTE)
      .findAll();
    const classes = await connection
      .setCollection(COLLECTION_GC_CLASS)
      .findAll();
    for (const phase of dataSlice) {
      if (phaseValue && phaseValue !== phase?.value) {
        continue;
      }
      content += dataTemplate(phase, attributes, classes);
    }

    if (!content || content.length === 0) {
      content = "Data not found";
    }

    content = `# ${metaData?.name} \r ${content}`;

    // PAGINATION
    const numberOfPagination = Math.ceil(
      phaseDatas?.length / Number.parseInt(MAX_RECORD_OF_PAGE),
    );
    //if (numberOfPagination > 1) {
    const components = [...Array(numberOfPagination)].map((_, index) => {
      return new ButtonBuilder()
        .setCustomId(`${index + 1}`)
        .setLabel(`${index + 1}`)
        .setStyle(index === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(index === 0);
    });
    let row = new ActionRowBuilder().addComponents(...components);

    if (numberOfPagination > 1) {
      const response = await interaction.editReply({
        content: content,
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
          const collectorFilter = (i) => i.user.id === interaction.user.id;
          if (collectorFilter) {
            const dataCurrentPage =
              Number.parseInt(MAX_RECORD_OF_PAGE) *
              (Number.parseInt(selectedId) - 1);
            let dataMaxPage =
              dataCurrentPage + Number.parseInt(MAX_RECORD_OF_PAGE);
            dataMaxPage =
              phaseDatas.length < dataMaxPage ? phaseDatas.length : dataMaxPage;

            const dataSlice = phaseDatas.slice(dataCurrentPage, dataMaxPage);
            content = "";
            for (const phase of dataSlice) {
              if (phaseValue && phaseValue !== phase.value) {
                continue;
              }
              content += dataTemplate(phase, attributes, classes);
            }

            if (!content || content.length === 0) {
              content = "Data not found";
            }

            content = `# ${metaData.name} \r ${content}`;

            row = new ActionRowBuilder();
            for (let index = 0; index < numberOfPagination; index++) {
              let record = index + 1;
              const pagiX = new ButtonBuilder()
                .setCustomId(`${record}`)
                .setLabel(`${record}`)
                .setStyle(ButtonStyle.Secondary);

              if (record == selectedId) {
                pagiX.setStyle(ButtonStyle.Primary).setDisabled(true);
              }
              row.addComponents(pagiX);
            }

            await i.update({ content: content, components: [row] });
          } else {
            await i.update({ components: [] });
          }
        } catch (e) {
          log.error(e);
          await interaction.editReply({
            ephemeral: true,
            content: "Confirmation not received within 1 minute, cancelling",
            components: [],
          });
        }
      });

      collector.on("end", async () => {
        try {
          await interaction.update({
            components: [],
          });
        } catch (e) {
          log.error(`Error end button gc meta: ${e}`);
        }
      });
    } else {
      await interaction.editReply({ content: content });
    }
  } catch (e) {
    log.error(`Error execute gc meta: ${e}`);
  }
};

const dataTemplate = (data, attributes, classes) => {
  const headerData = `${bold(data.name)} ${bold(dataSubTemplete(data.subName, attributes, classes))}`;
  let dataIcon = "";
  // data.iconHeros.forEach(i => {
  //     dataIcon += `${i} `;
  // })
  const dataKey = codeBlock(data.key ?? "Data not Found");
  return `${headerData} ${dataIcon} ${dataKey} \r`;
};

const dataSubTemplete = (dataSub, attributes, classes) => {
  const dataSubArr = dataSub.split(",");
  const dataConvertArr = [...Array(dataSubArr.length)].map((_, index) => {
    const attribute = attributes.filter((x) => x.id === dataSubArr[index])[0];
    const clazz = classes.filter((x) => x.id === dataSubArr[index])[0];
    let emojiCd = attribute?.value ?? clazz?.value;
    return emojiCd ? formatEmoji(emojiCd) : dataSubArr[index];
  });
  // for (let index = 0; index < dataSubArr.length; index++) {
  //     const attribute = attributes.filter(x => x.id === dataSubArr[index])[0];
  //     const clazz = classes.filter(x => x.id === dataSubArr[index])[0];
  //     let emojiCd = attribute?.value ?? clazz?.value;
  //     let emojiKey = emojiCd ? formatEmoji(emojiCd) : dataSubArr[index];
  //     dataConvertArr.push(emojiKey);
  // }
  return dataConvertArr.join(" ");
};

const devOnly = false;

export { data, validate, autocomplete, execute, devOnly };
