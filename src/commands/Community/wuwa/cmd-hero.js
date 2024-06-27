import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, ActionRowBuilder, ComponentType, formatEmoji, blockQuote, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { convertDateToTimetamp } from '../../../utils/date.js';
import { COLLECTION_WUWE_ATTRIBUTE, COLLECTION_WUWE_HERO, COLLECTION_WUWE_IMAGE, COLLECTION_WUWE_WEAPON } from '../../../utils/constants.js';

import logger from "../../../utils/log.js";
import ConnectionWuwa from '../../../db/databaseWuwa.js';
const log = logger(import.meta.filename);

const connection = new ConnectionWuwa();

const domainName = process.env.domain;

const data = new SlashCommandBuilder()
    .setName('ww-hero')
    .setDescription('Wuthering waves Hero Build Command!')
    .addStringOption(option =>
        option.setName('hero')
            .setDescription('The hero category')
            .setRequired(true)
            .setAutocomplete(true)
    );

const autocomplete = async (interaction) => {
    try {
        const focusedValue = interaction.options.getFocused();
        // const heros = await findAll(COLLECTION_WUWE_HERO, DATABASE_NAME_WUWE);
        const heros = await connection.setCollection(COLLECTION_WUWE_HERO).findAll();
        // const heros = [{
        //     name: 'Rover (Havoc)',
        //     value: 'ww_rover_havoc',
        //     attribute: 'havocattr',
        //     weapon: 'weapon_sword',
        //     rarity: 5,
        //     updated: '2024-06-05T17:00:00.000Z'
        // }]
        log.info("heros %s", heros.length);
        const fileterChoices = heros.filter((hero) =>
            hero.name?.toLowerCase().startsWith(focusedValue?.toLowerCase())
        );
        const results = fileterChoices.map((choice, index) => {
            return {
                name: choice.name,
                value: choice.value ?? `v${index}`
            }
        });
        await interaction.respond(results.slice(0, 25));
    } catch (e) {
        log.error(e);
        const results = [{
            name: "Data not Found",
            value: `dt`
        }]
        await interaction.respond(results);
    }
}

const execute = async (interaction, client) => {
    try {
        const heroValue = interaction.options.getString('hero');
        log.info("hero", heroValue);

        // const heroData = await findOne(COLLECTION_WUWE_HERO, { value: heroValue }, DATABASE_NAME_WUWE);
        const heroData = await connection
            .setQuery({ value: heroValue })
            .setCollection(COLLECTION_WUWE_HERO)
            .findOne();
        // const heroData = heros.find(h => h.value === heroValue);

        if (!heroValue || !heroData) return await interaction.editReply({ content: 'Hero not found!' });

        // const fileImageData = await findAll(COLLECTION_WUWE_IMAGE, DATABASE_NAME_WUWE);
        const fileImageData = await connection
            .setCollection(COLLECTION_WUWE_IMAGE)
            .findAll();

        // const attributeData = await findOne(COLLECTION_WUWE_ATTRIBUTE, { id: heroData.attribute }, DATABASE_NAME_WUWE);
        // const weaponData = await findOne(COLLECTION_WUWE_WEAPON, { id: heroData.weapon }, DATABASE_NAME_WUWE);
        const attributeData = await connection
            .setQuery({ id: heroData.attribute })
            .setCollection(COLLECTION_WUWE_ATTRIBUTE)
            .findOne();
        const weaponData = await connection
            .setQuery({ id: heroData.weapon })
            .setCollection(COLLECTION_WUWE_WEAPON)
            .findOne();
        const attribute = attributeData ? formatEmoji(attributeData.value) : "";
        const weapon = weaponData ? formatEmoji(weaponData.value) : "";
        const rarity = `${heroData.rarity ?? ""}★`;

        // const embebArr = [];
        // const selectArr = [];

        const dataEmbeb = {
            data: heroData,
            weapon: weapon,
            attribute: attribute,
            rarity: rarity,
        };

        // for (const [index, imageData] of fileImageData.entries()) {
        //     dataEmbeb.title = imageData.content;
        //     dataEmbeb.imageName = imageData.data[0].image_name;

        //     // embebArr.push(await createDataEmbeds(dataEmbeb));
        //     selectArr.push(new StringSelectMenuOptionBuilder()
        //         .setLabel(imageData.content)
        //         .setValue(`${index + 1}`)
        //         .setDefault(index == 0 ? true : false)
        //     );
        // }

        const embebArr = fileImageData.map((imageData) => {
            dataEmbeb.title = imageData.content;
            dataEmbeb.imageName = imageData.data[0].image_name;
            return createDataEmbeds(dataEmbeb);
        })

        const selectArr = fileImageData.map((imageData, index) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(imageData.content)
                .setValue(`${index + 1}`)
                .setDefault(index === 0 ? true : false)});

        const selectRow = new StringSelectMenuBuilder()
            .setCustomId('starter')
            .setPlaceholder('Make a selection!')
            .addOptions(...selectArr);

        const row = new ActionRowBuilder()
            .addComponents(selectRow);

        const response = await interaction.editReply({ embeds: embebArr[0], components: [row] });

        // const collectorFilter = i => i.user.id === interaction.user.id;
        // const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
        collector.on('collect', async i => {
            try {
                const selectedId = i.values[0];

                row.components[0].options.map((option) => 
                    option.data.value === selectedId ? option.setDefault(true) : option.setDefault(false)
                );

                // log.info(selectedId);
                await i.update({ embeds: embebArr[selectedId - 1], components: [row] });
            } catch (e) {
                log.error(`Error select wuwa: ${e}`);
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        })

        collector.on('end', async i => {
            try {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            } catch (e) {
                log.error(`Error end select wuwa: ${e}`);
                await interaction.deleteReply();
            }
        })

    } catch (e) {
        log.error(`Error execute wuwa hero: ${e}`);
    }
}

const createDataEmbeds = (dataEmbeb) => {
    let embedArr = [];
    const imageNames = dataEmbeb.imageName.split(',');
    if (imageNames && imageNames.length > 0) {
        embedArr = imageNames.map((imageName, index) => {
            const imagePath = `${domainName}/wuwa/${dataEmbeb.data.value}/${imageName}.jpg`;
            // log.info('imagePath %s', imagePath);
            dataEmbeb.imagePath = imagePath;
            const isLastRecord = index === imageNames.length - 1;
            const isHeaderRecord = index === 0;
            return createEmbedTemplate(dataEmbeb, isLastRecord, isHeaderRecord);
        });
    } else {
        log.warn("image not found");
    }

    return embedArr;
}

const createEmbedTemplate = (template, isLastRecord = true, isHeaderRecord = true) => {
    const equipEmbed = new EmbedBuilder();
    if (isHeaderRecord) {
        equipEmbed.setTitle(`${template.data.name}`)
            .addFields(
                { name: 'Rarity', value: `${template.rarity}`, inline: true },
                { name: 'Element', value: `${template.attribute}`, inline: true },
                { name: 'Weapon', value: `${template.weapon}`, inline: true },
                { name: 'Copyright', value: `${blockQuote(`@wutheringwave.id`)}`, inline: false },
            );
    }
    // log.info('imagePath %s', template.imagePath);
    equipEmbed.setImage(template.imagePath);
    if (isLastRecord) {
        equipEmbed
            .setTimestamp(convertDateToTimetamp(template.data.updated))
            .setFooter({ text: 'Last updated' });
    }
    return equipEmbed.setColor("Random");
}

export { data, autocomplete, execute };