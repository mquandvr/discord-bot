import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, formatEmoji, blockQuote, codeBlock } from 'discord.js';
import fs from 'fs';
import * as Table from '../../utils/table.js';
import { convertDateToTimetamp } from '../../utils/date.js';
import { findAll, findOne } from '../../database.js';
import { COLLECTION_ATTRIBUTE, COLLECTION_CLASS, COLLECTION_HERO, COLLECTION_TIER, DATABASE_NAME_GRANDCHASE } from '../../utils/constants.js';

var domainName = process.env.domain;

//import heros from '../../data/hero.json';
// import classes from '../../data/class.json';
// import attributes from '../../data/attribute.json';
// import tiers from '../../data/tier.json';

// let heros = await import('../../data/hero.json', {assert: { type: "json" }});
// let classes = await import('../../data/class.json', {assert: { type: "json" }});
// let attributes = await import('../../data/attribute.json', {assert: { type: "json" }});
// let tiers = await import('../../data/tier.json', {assert: { type: "json" }});

const data = new SlashCommandBuilder()
    .setName('gc-hero')
    .setDescription('Grandchase Hero Build Command!')
    .addStringOption(option =>
        option.setName('hero')
            .setDescription('The hero category')
            .setRequired(true)
            .setAutocomplete(true)
    );

const autocomplete = async (interaction, client) => {
    try {
        const focusedValue = interaction.options.getFocused();
        const heros = await findAll(COLLECTION_HERO, DATABASE_NAME_GRANDCHASE);
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

        const heroData = await findOne(COLLECTION_HERO, {value: heroValue}, DATABASE_NAME_GRANDCHASE);
        // const heroData = heros.find(h => h.value === heroValue);

        if (!heroValue || !heroData) return await interaction.editReply({ content: 'Hero not found!' });

        let fileNames = [];
        try {
            fileNames = fs.readdirSync(`./assets/${heroData.value}`).filter(file => file.endsWith(".jpg"));
        } catch (e) {
            console.log("File image not found!");
            fileNames = [];
        }
        const attributeData = await findOne(COLLECTION_ATTRIBUTE, {id: heroData.attribute}, DATABASE_NAME_GRANDCHASE);
        const clazzData = await findOne(COLLECTION_CLASS, {id: heroData.clazz}, DATABASE_NAME_GRANDCHASE);
        const attribute = attributeData ? formatEmoji(attributeData.value) : "";
        const clazz = clazzData ? formatEmoji(clazzData.value) : "";
        const content = heroData.content ?? "PVE";

        let equipFileNames = [];
        let siFileNames = [];
        let iconFileNames = [];
        if (fileNames && fileNames.length > 0) {
            equipFileNames = fileNames.filter(file => file.match('(_equip)(?:[\.|\_])'));
            siFileNames = fileNames.filter(file => file.match('(_si)(?:[\.|\_])'));
            iconFileNames = fileNames.filter(file => file.match('(_icon)(?:[\.|\_])'));
            console.log("equipFileNames", equipFileNames);
        }
        const equipEmbedArr = await createDataEmbeds(equipFileNames, 'Equipment Recommendation', clazz, attribute, content, heroData, iconFileNames[0]);
        const siEmbedArr = await createDataEmbeds(siFileNames, 'Soul Imprint Recommendation', clazz, attribute, content, heroData, iconFileNames[0]);

        const equipmentBtn = new ButtonBuilder()
            .setCustomId('equipmentBtn')
            .setLabel('Equipment')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const siBtn = new ButtonBuilder()
            .setCustomId('siBtn')
            .setLabel('Soul Imprint')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false);

        let row = new ActionRowBuilder()
            .addComponents(equipmentBtn, siBtn);

        //const channel = client.channels.cache.get(interaction.channel.id);
        //await interaction.reply({ ephemeral: true, content: 'Loading...!' });
        //await channel.send({ embeds: embed, files: file });
        //await interaction.deleteReply();
        const response = await interaction.editReply({ ephemeral: false, embeds: equipEmbedArr, components: [row], fetchReply: true });
        //const collectorFilter = i => i.user.id === interaction.user.id;

        //const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });
        collector.on('collect', async i => {
            try {
                const selectedId = i.customId
                const collectorFilter = i => i.user.id === interaction.user.id;
                if (collectorFilter) {
                    if (selectedId === 'equipmentBtn') {
                        equipmentBtn.setDisabled(true).setStyle(ButtonStyle.Primary);
                        siBtn.setDisabled(false).setStyle(ButtonStyle.Secondary);

                        await i.update({ ephemeral: false, embeds: equipEmbedArr, components: [row], fetchReply: true });
                    } else if (selectedId === 'siBtn') {
                        equipmentBtn.setDisabled(false).setStyle(ButtonStyle.Secondary);
                        siBtn.setDisabled(true).setStyle(ButtonStyle.Primary);

                        await i.update({ ephemeral: false, embeds: siEmbedArr, components: [row], fetchReply: true });
                    }
                } else {
                    await i.update({ components: [] });
                }
            } catch (e) {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        })

        collector.on('end', async i => {
            try {
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            } catch (e) {
                console.error(e);
            }
        })

    } catch (e) {
        console.log(e);
    }
}

const createDataEmbeds = async(fileNames, title, clazz, attribute, content, heroData, icon) => {
    const embedArr = [];
    let template = {
        data: heroData,
        title: title,
        clazz: clazz,
        attribute: attribute,
        content: content,
        icon: icon,
    };
    let cnt = 0;
    if (fileNames && fileNames.length > 0) {
        for (const fileName of fileNames) {
            cnt++;
            const imagePath = `${domainName}/${template.data.value}/${fileName}`;
            console.log('imagePath', imagePath);
            template.imagePath = imagePath;
            const isLastRecord = cnt === fileNames.length;
            const isHeaderRecord = cnt === 1;
            const embedTemplate = await createEmbedTemplate(template, isLastRecord, isHeaderRecord);
            embedArr.push(embedTemplate);
        }
    } else {
        console.log("image not found");
        const imagePath = "https://salonlfc.com/wp-content/uploads/2018/01/image-not-found-scaled-1150x647.png";
        const embedTemplate = await createEmbedTemplate(template, imagePath);
        embedArr.push(embedTemplate);
    }

    return embedArr;
}

const createEmbedTemplate = async (template, isLastRecord, isHeaderRecord) => {
    //let fileImage = new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`);
    //file.push(new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`));
    //console.log(imagePath);
    const equipEmbed = new EmbedBuilder()
        .setColor(0x0099FF);
    if (isHeaderRecord) {
        const contentTable = await createContentTable(template.data.value);
        equipEmbed.setTitle(template.title)
            //.setThumbnail(`${domainName}/${template.data.value}/${template.icon}`)
            .addFields(
                { name: 'Hero Name', value: `${template.data.name} ${template.clazz} ${template.attribute}`, inline: true },
                { name: 'Content', value: `${codeBlock(contentTable)}`, inline: false },
                { name: 'Note', value: `${blockQuote(template.data.note ?? "Updating!")}`, inline: false },
        );
    }
    //equipEmbeb.setImage(`attachment://${fileName}`)
    equipEmbed.setImage(template.imagePath);
    if (isLastRecord) {
        equipEmbed
            .setTimestamp(convertDateToTimetamp(template.data.updated))
            .setFooter({ text: 'Last updated' });
    }
    return equipEmbed;
}

const createContentTable = async(hero) => {
    const tier = await findOne(COLLECTION_TIER, {hero: hero}, DATABASE_NAME_GRANDCHASE);

    if (!tier) return "Updating!";
    
    const columns = [
        {
          width: 13,
          label: 'Content',
          index: 0,
          field: 'content',
        },
        {
          width: 20,
          label: 'Phase',
          index: 1,
          field: 'phase',
        },
        {
          width: 7,
          label: 'Rank',
          index: 2,
          field: 'rank',
        },
      ];
    const table = new Table.TableBuilder(columns);
    tier.data.forEach(t => {
        table.addRows(t);
    });

    return table.build();
}

export { data, autocomplete, execute };