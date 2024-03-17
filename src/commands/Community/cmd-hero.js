const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, formatEmoji, blockQuote, codeBlock } = require('discord.js');
const fs = require('fs');
const { TableBuilder } = require('../../utils/table.js');
const { convertDateToTimetamp } = require('../../utils/date.js');

var domainName = process.env.domain;

const heros = require('../../data/hero.json');
const classes = require('../../data/class.json');
const attributes = require('../../data/attribute.json');
const tiers = require('../../data/tier.json');

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
        const fileterChoices = heros.filter((hero) =>
            hero.name.toLowerCase().startsWith(focusedValue.toLowerCase())
        );
        const results = fileterChoices.map((choice) => {
            return {
                name: choice.name,
                value: choice.value
            }
        });
        await interaction.respond(results.slice(0, 25));
    } catch (e) {
        console.log(e);
    }
}

const execute = async (interaction, client) => {
    try {
        const heroValue = interaction.options.getString('hero');
        console.log("hero", heroValue);

        const heroData = heros.find(h => h.value === heroValue);

        if (!heroValue || !heroData) return await interaction.reply({ content: 'Hero not found!' });

        let fileNames = [];
        try {
            fileNames = fs.readdirSync(`./assets/${heroData.value}`).filter(file => file.endsWith(".jpg"));
        } catch (e) {
            console.log("File image not found!");
            fileNames = [];
        }
        const attribute = attributes[heroData.attribute] ? formatEmoji(attributes[heroData.attribute]) : "";
        const clazz = classes[heroData.clazz] ? formatEmoji(classes[heroData.clazz]) : "";
        const content = heroData.content ?? "PVE";

        let equipFileNames = [];
        let siFileNames = [];
        if (fileNames && fileNames.length > 0) {
            equipFileNames = fileNames.filter(file => file.match('(_equip)(?:[\.|\_])'));
            siFileNames = fileNames.filter(file => file.match('(_si)(?:[\.|\_])'));

            console.log("equipFileNames", equipFileNames);
        }
        const equipEmbedArr = createDataEmbeds(equipFileNames, 'Equipment Recommendation', clazz, attribute, content, heroData);
        const siEmbedArr = createDataEmbeds(siFileNames, 'Soul Imprint Recommendation', clazz, attribute, content, heroData);

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
        const response = await interaction.reply({ ephemeral: false, embeds: equipEmbedArr, components: [row], fetchReply: true });
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

const createDataEmbeds = (fileNames, title, clazz, attribute, content, heroData) => {
    const embedArr = [];
    let template = {
        data: heroData,
        title: title,
        clazz: clazz,
        attribute: attribute,
        content: content
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
            const embedTemplate = createEmbedTemplate(template, isLastRecord, isHeaderRecord);
            embedArr.push(embedTemplate);
        }
    } else {
        console.log("image not found");
        const imagePath = "https://salonlfc.com/wp-content/uploads/2018/01/image-not-found-scaled-1150x647.png";
        const embedTemplate = createEmbedTemplate(template, imagePath);
        embedArr.push(embedTemplate);
    }

    return embedArr;
}

const createEmbedTemplate = (template, isLastRecord, isHeaderRecord) => {
    //let fileImage = new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`);
    //file.push(new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`));
    //console.log(imagePath);
    const equipEmbed = new EmbedBuilder()
        .setColor(0x0099FF);
    if (isHeaderRecord) {
        equipEmbed.setTitle(template.title)
            //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
            .addFields(
                { name: 'Hero Name', value: `${template.data.name} ${template.clazz} ${template.attribute}`, inline: true },
                { name: 'Content', value: `${codeBlock(createContentTable(template.data.value))}`, inline: false },
                { name: 'Note', value: `${blockQuote(template.data.note ?? "Nothing.")}`, inline: false },
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

const createContentTable = (hero) => {
    const tier = tiers.find(v => v.hero === hero);

    if (!tier) return "Nothing!";
    
    const columns = [
        {
          width: 15,
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
          width: 10,
          label: 'Rank',
          index: 1,
          field: 'rank',
        },
      ];
    const table = new TableBuilder(columns);
    tier.data.forEach(t => {
        table.addRows(t);
    });

    return table.build();
}

module.exports = { data, autocomplete, execute };