const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');

var domainName = process.env.domain;

const heros = require('../../data/hero.json');
const classes = require('../../data/class.json');
const attributes = require('../../data/attribute.json');

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
    const focusedValue = interaction.options.getFocused();
    const fileterChoices = heros.filter((hero) =>
        hero.name.toLowerCase().startsWith(focusedValue.toLowerCase())
    );
    const results = fileterChoices.map((choice) => {
        return {
            name: choice.name,
            value: choice.value
        }
    })
    await interaction.respond(results.slice(0, 25));
}

const execute = async (interaction, client) => {

    const heroValue = interaction.options.getString('hero');
    console.log("hero", heroValue);

    const heroData = heros.find(h => h.value === heroValue);

    if (!heroValue || !heroData) return await interaction.reply({ content: 'Hero not found!' });

    const fileNames = fs.readdirSync(`./assets/${heroData.value}`).filter(file => file.endsWith(".jpg"));
    const attribute = attributes[heroData.attribute] || "none";
    const clazz = classes[heroData.clazz] || "none";
    const content = heroData.content || "PVE";
    
    let equipEmbedArr = [];
    let siEmbedArr = [];

    if (fileNames && fileNames.length > 0) {
        const equipFileNames = fileNames.filter(file => file.includes("equip"));
        const siFileNames = fileNames.filter(file => file.includes("si"));

        console.log("equipFileNames", equipFileNames)

        equipEmbedArr = createDataEmbeds(equipFileNames, 'Equipment Recommendation', clazz, attribute, content, heroData);
        siEmbedArr = createDataEmbeds(siFileNames, 'Soul Imprint Recommendation', clazz, attribute, content, heroData);
    }

    const equipmentBtn = new ButtonBuilder()
        .setCustomId('equipmentBtn')
        .setLabel('Equipment')
        .setStyle(ButtonStyle.Primary);

    const siBtn = new ButtonBuilder()
        .setCustomId('siBtn')
        .setLabel('Soul Imprint')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(equipmentBtn, siBtn);

    //const channel = client.channels.cache.get(interaction.channel.id);
    //await interaction.reply({ ephemeral: true, content: 'Loading...!' });
    //await channel.send({ embeds: embed, files: file });
    //await interaction.deleteReply();
    const response = await interaction.reply({ ephemeral: true, embeds: equipEmbedArr, components: [row], fetchReply: true });
    //const collectorFilter = i => i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
    collector.on('collect', async i => {
        try {
            const selectedId = i.customId
            const collectorFilter = i => i.user.id === interaction.user.id;
            if (collectorFilter) {
                if (selectedId === 'equipmentBtn') {
                    await i.update({ ephemeral: true, embeds: equipEmbedArr, components: [row], fetchReply: true });
                } else if (selectedId === 'siBtn') {
                    await i.update({ ephemeral: true, embeds: siEmbedArr, components: [row], fetchReply: true });
                }
            } else {
                await i.update({ components: [] });
            }
        } catch (e) {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    })

    collector.on('end', async i => {
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    })
}

const createDataEmbeds = (fileNames, title, clazz, attribute, content, heroData) => {
    const embedArr = [];
    let template = {
        data: heroData,
        title: title,
        clazz: clazz,
        attribute: attribute,
        content: content
    }
    let cnt = 0;
    if (fileNames && fileNames.length > 0) {
        for (const fileName of fileNames) {
            cnt++;
            const imagePath = `${domainName}/media/${template.data.value}/${fileName}`;
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
                { name: 'Content', value: `${template.content}`, inline: true },
            )
    }
    //equipEmbeb.setImage(`attachment://${fileName}`)
    equipEmbed.setImage(template.imagePath);
    if (isLastRecord) {
        equipEmbed
            .setTimestamp(template.data.timestamp)
            .setFooter({ text: 'Last updated' });
    }
    return equipEmbed;
}

module.exports = { data, autocomplete, execute }