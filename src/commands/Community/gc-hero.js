const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

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

    const file = [];
    const embed = [];
    let equipEmbeb;
    let siEmbeb;
    let equipImgHeader = false;
    let siImgHeader = false;
    let cnt = 0;

    if (fileNames && fileNames.length > 0) {
        for (const fileName of fileNames) {
            cnt++;
            let fileImage = new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`);
            file.push(new AttachmentBuilder(`./assets/${heroData.value}/${fileName}`));

            if (fileName.includes("equip")) {
                equipEmbeb = new EmbedBuilder()
                    .setColor(0x0099FF);
                if (!equipImgHeader) {
                    equipEmbeb.setTitle('Equipment Recommendation')
                        //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
                        .addFields(
                            { name: 'Hero Name', value: `${heroData.name} ${clazz} ${attribute}`, inline: true },
                            { name: 'Content', value: `${content}`, inline: true },
                        )

                    equipImgHeader = true;
                }
                equipEmbeb.setImage(`attachment://${fileName}`)
                embed.push(equipEmbeb);
            }

            if (fileName.includes("si")) {
                siEmbeb = new EmbedBuilder()
                    .setColor(0x0099FF);
                if (!siImgHeader) {
                    siEmbeb.setTitle('Soul Imprint Recommendation')
                    siImgHeader = true;
                }
                siEmbeb.setImage(`attachment://${fileName}`)

                if (cnt === fileNames.length) {
                    siEmbeb
                        .setTimestamp(heroData.timestamp)
                        .setFooter({ text: 'Last updated' });
                }
                embed.push(siEmbeb);
            }
        }
    } else {
        console.log("image not found");
        equipEmbeb = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Equipment Recommendation')
            //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
            .addFields(
                { name: 'Hero Name', value: `${heroData.name} ${clazz} ${attribute}`, inline: true },
                { name: 'Content', value: `${content}`, inline: true },
            )
            .setImage("https://salonlfc.com/wp-content/uploads/2018/01/image-not-found-scaled-1150x647.png")
        embed.push(equipEmbeb);
    }

    const channel = client.channels.cache.get(interaction.channel.id);
    await interaction.reply({ ephemeral: true, content: 'Loading...!' });
    await channel.send({ embeds: embed, files: file });
    await interaction.deleteReply();
}

module.exports = { data, autocomplete, execute }