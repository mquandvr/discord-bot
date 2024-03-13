const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');

var domainName = process.env.domain;

const metas = require('../../data/meta.json');

const MAX_RECORD_OF_PAGE = process.env.max_record_of_page ?? 6;

const data = new SlashCommandBuilder()
    .setName('gc-meta')
    .setDescription('Grandchase Hero Build Command!')
    .addStringOption(option =>
        option.setName('content')
            .setDescription('Select a content')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option.setName('phase')
            .setDescription('Select a phase')
            .setRequired(false)
            .setAutocomplete(true)
    );

const autocomplete = async (interaction, client) => {
    try {
        const focusedValue = interaction.options.getFocused();
        let fileterChoices = [];
        let metaFileterChoices = [];
    
        const content = interaction.options.getString('content');
        const phase = interaction.options.getString('phase');
        console.log("content", content);
        console.log("phase", phase);
    
        if (phase !== null) {
            metaFileterChoices = metas?.filter((meta) =>
                meta?.value?.toLowerCase() === content
            );
            fileterChoices = metaFileterChoices[0]?.data.filter((data) =>
                data?.name.toLowerCase().includes(focusedValue.toLowerCase())
            );
        } else if (content !== null) {
            metaFileterChoices = metas?.filter((meta) =>
                meta?.name.toLowerCase().includes(focusedValue.toLowerCase())
            );
            fileterChoices = metaFileterChoices;
        }
    
        const results = fileterChoices?.map((choice) => {
            return {
                name: choice?.name,
                value: choice?.value
            };
        });

        console.log("results", results)
        await interaction.respond(results);
    } catch (e) {
        console.error(e)
        const results = [{
            name: "Data not Found",
            value: 0
        }]
        await interaction.respond(results);
    }
    
}

const execute = async (interaction, client) => {
    const contentValue = interaction.options.getString('content');
    const phaseValue = interaction.options.getString('phase');
    console.log("content", contentValue);
    console.log("phase", phaseValue);

    const metaData = metas?.find(h => h?.value === contentValue);

    if (!contentValue || !metaData || !metaData.data) return await interaction.reply({ content: 'Meta not found!' });

    let content = "";
    const dataSlice = metaData.data.length > MAX_RECORD_OF_PAGE ? metaData.data.slice(0, MAX_RECORD_OF_PAGE) : metaData.data;
    for (const phase of dataSlice) {
        if (phaseValue && phaseValue !== phase?.value) {
            continue;
        }
        content += dataTemplate(phase);
    }

    if (!content || content.length === 0) {
        content = "Data not found";
    }

    content = `# ${metaData?.name} \r ${content}`;

    // PAGINATION BUTTON
    let row = new ActionRowBuilder();
    const numberOfPagination = Math.ceil(metaData?.data?.length / Number.parseInt(MAX_RECORD_OF_PAGE));
    //if (numberOfPagination > 1) {
    for (let index = 0; index < numberOfPagination; index++) {
        let record = index + 1;
        const pagiX = new ButtonBuilder()
            .setCustomId(`${record}`)
            .setLabel(`${record}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false);
        if (record === 1) {
            pagiX.setStyle(ButtonStyle.Primary)
                .setDisabled(true);
        }
        row.addComponents(pagiX);
    }
    //}

    let response;
    if (numberOfPagination > 1) {
        response = await interaction.reply({ ephemeral: false, content: content, components: [row], fetchReply: true })

        //const collectorFilter = i => i.user.id === interaction.user.id;

        //const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });
        collector.on('collect', async i => {
            try {
                const selectedId = i.customId
                const collectorFilter = i => i.user.id === interaction.user.id;
                if (collectorFilter) {
                    const dataCurrentPage = Number.parseInt(MAX_RECORD_OF_PAGE) * (Number.parseInt(selectedId) - 1);
                    let dataMaxPage = dataCurrentPage + Number.parseInt(MAX_RECORD_OF_PAGE);
                    dataMaxPage = metaData.data.length < dataMaxPage ? metaData.data.length : dataMaxPage;

                    const dataSlice = metaData.data.slice(dataCurrentPage, dataMaxPage);
                    content = "";
                    for (const phase of dataSlice) {
                        if (phaseValue && phaseValue !== phase.value) {
                            continue;
                        }
                        content += dataTemplate(phase);
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
                            .setStyle(ButtonStyle.Secondary)

                        if (record == selectedId) {
                            pagiX.setStyle(ButtonStyle.Primary)
                                .setDisabled(true);
                        }
                        row.addComponents(pagiX);
                    }

                    await i.update({ ephemeral: false, content: content, components: [row], fetchReply: true });
                } else {
                    await i.update({ components: [] });
                }
            } catch (e) {
                console.error(e)
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        })

        collector.on('end', async i => {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        })
    } else {
        await interaction.reply({ ephemeral: false, content: content, fetchReply: false })
    }

}

const dataTemplate = (data, title) => {
    const headerData = `**${data.name}**`;
    const dataKey = `\`\`\`${data.key ?? "Data not Found"}\`\`\``;
    return `${headerData} ${dataKey} \r`;
}

module.exports = { data, autocomplete, execute };