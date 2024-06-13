import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, ActionRowBuilder, ComponentType, formatEmoji, blockQuote, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { convertDateToTimetamp } from '../../../utils/date.js';
import { findAll, findOne } from '../../../database.js';
import { COLLECTION_WUWE_ATTRIBUTE, COLLECTION_WUWE_HERO, COLLECTION_WUWE_IMAGE, COLLECTION_WUWE_WEAPON, DATABASE_NAME_WUWE } from '../../../utils/constants.js';

var domainName = process.env.domain;

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
        const heros = await findAll(COLLECTION_WUWE_HERO, DATABASE_NAME_WUWE);
        // const heros = [{
        //     name: 'Rover (Havoc)',
        //     value: 'ww_rover_havoc',
        //     attribute: 'havocattr',
        //     weapon: 'weapon_sword',
        //     rarity: 5,
        //     updated: '2024-06-05T17:00:00.000Z'
        // }]
        console.log("heros", heros)
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
        console.log(e);
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
        console.log("hero", heroValue);

        const heroData = await findOne(COLLECTION_WUWE_HERO, { value: heroValue }, DATABASE_NAME_WUWE);
        // const heroData = heros.find(h => h.value === heroValue);

        if (!heroValue || !heroData) return await interaction.editReply({ content: 'Hero not found!' });

        const fileImageData = await findAll(COLLECTION_WUWE_IMAGE, DATABASE_NAME_WUWE);

        const attributeData = await findOne(COLLECTION_WUWE_ATTRIBUTE, { id: heroData.attribute }, DATABASE_NAME_WUWE);
        const weaponData = await findOne(COLLECTION_WUWE_WEAPON, { id: heroData.weapon }, DATABASE_NAME_WUWE);
        const attribute = attributeData ? formatEmoji(attributeData.value) : "";
        const weapon = weaponData ? formatEmoji(weaponData.value) : "";
        const rarity = `${heroData.rarity ?? ""}★`;

        let count = 0;
        const embebArr = [];
        const selectArr = [];

        const dataEmbeb = {
            data: heroData,
            weapon: weapon,
            attribute: attribute,
            rarity: rarity,
        };

        for (const imageData of fileImageData) {
            dataEmbeb.title = imageData.content;
            dataEmbeb.imageName= imageData.data[0].image_name;

            embebArr.push(await createDataEmbeds(dataEmbeb));
            selectArr.push(new StringSelectMenuOptionBuilder()
                .setLabel(imageData.content)
                .setValue(`${++count}`)
                // .setDefault(count == 1 ? true : false)
            );
        }

        const selectRow = new StringSelectMenuBuilder()
            .setCustomId('starter')
            .setPlaceholder('Make a selection!')
            .addOptions(...selectArr);

        const row = new ActionRowBuilder()
			.addComponents(selectRow);
            
        const response = await interaction.editReply({ ephemeral: false, embeds: embebArr[0], components: [row], fetchReply: true });

        const collectorFilter = i => i.user.id === interaction.user.id;
        // const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
        collector.on('collect', async i => {
            try {
                const selectedId = parseInt(i.values[0]);
                console.log(selectedId);
                await i.update({ ephemeral: false, embeds: embebArr[selectedId - 1], fetchReply: true });
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        })

        collector.on('end', async i => {
            try {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            } catch (e) {
                console.error(e);
                await interaction.deleteReply();
            }
        })

    } catch (e) {
        console.log(e);
        await interaction.deleteReply();
    }
}

const createDataEmbeds = async (dataEmbeb) => {
    const embedArr = [];
    let cnt = 0;
    const imageNames = dataEmbeb.imageName.split(',');
    if (imageNames && imageNames.length > 0) {
        for (const imageName of imageNames) {
            cnt++;
            const imagePath = `${domainName}/wuwa/${dataEmbeb.data.value}/${imageName}.jpg`;
            console.log('imagePath', imagePath);
            dataEmbeb.imagePath = imagePath;
            const isLastRecord = cnt === imageNames.length;
            const isHeaderRecord = cnt === 1;
            const embedTemplate = await createEmbedTemplate(dataEmbeb, isLastRecord, isHeaderRecord);
            embedArr.push(embedTemplate);
        }
    } else {
        console.log("image not found");
        const imagePath = "https://salonlfc.com/wp-content/uploads/2018/01/image-not-found-scaled-1150x647.png";
        dataEmbeb.imagePath = imagePath;
        const embedTemplate = await createEmbedTemplate(dataEmbeb);
        embedArr.push(embedTemplate);
    }

    return embedArr;
}

const createEmbedTemplate = async (template, isLastRecord = true, isHeaderRecord = true) => {
    const equipEmbed = new EmbedBuilder()
        .setColor(0x0099FF);
    if (isHeaderRecord) {
        equipEmbed.setTitle(`${template.data.name}`)
            .addFields(
                { name: 'Rarity', value: `${template.rarity}`, inline: true },
                { name: 'Element', value: `${template.attribute}`, inline: true },
                { name: 'Weapon', value: `${template.weapon}`, inline: true },
                { name: 'Copyright', value: `${blockQuote(`@wutheringwave.id`)}`, inline: false },
            );
    }
    equipEmbed.setImage(template.imagePath);
    if (isLastRecord) {
        equipEmbed
            .setTimestamp(convertDateToTimetamp(template.data.updated))
            .setFooter({ text: 'Last updated' });
    }
    return equipEmbed.setColor("Random");
}

export { data, autocomplete, execute };