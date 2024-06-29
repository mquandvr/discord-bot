import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord.js';
import { convertStrToTimetamp, convertYMDStrToTimetamp } from '../../../utils/date.js';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { COLLECTION_WUWE_CHANNEL, COLLECTION_WUWE_NEWS } from '../../../utils/constants.js';

import logger from "../../../utils/log.js";
import ConnectionWuwa from '../../../db/databaseWuwa.js';
const log = logger(import.meta.filename);

const connection = new ConnectionWuwa();

const aiCode = process.env.ai_code;
const genAI = new GoogleGenerativeAI(aiCode);

const generationConfig = {
    maxOutputTokens: 5000,
    temperature: 0.9,
    topP: 0.1,
    topK: 16,
};
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });

const CONTENT_MAX_LENGTH = 2000;

const data = new SlashCommandBuilder()
    .setName('ww-news')
    .setDescription('Wuthering News Command!')
    .addSubcommand((subcommand) => subcommand
        .setName('choose')
        .setDescription('choose date and channel (optional)')
        .addStringOption(option =>
            option.setName("date")
                .setDescription("Set date News. Format: yyyyMMdd")
                .setRequired(false)
        )
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription('The channel the message should be sent to.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName('schedule')
        .setDescription('choose date and channel (optional)')
        .addBooleanOption(option =>
            option.setName("enable")
                .setDescription("Enable the bot to send news on 1 time / 1 hour.")
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription('The channel the message should be sent to.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
    );

const validate = async (interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const date = interaction.options.getString('date');
    if (subcommand === "choose") {
        if (date && !isNaN(new Date(date))) {
            log.info("Error format date");
            await interaction.editReply({ ephemeral: true, content: 'Wrong format date (yyyyMMdd)!.' });
            return false;
        }
    }
    return true;
};

const execute = async (interaction) => {
    try {
        // const schedule = interaction.options.getChannel('schedule');
        //await interaction.reply({ ephemeral: false, content: 'Waiting', fetchReply: true });
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        if (subcommand === "schedule") {
            const enabled = interaction.options.getBoolean('enable');
            await createChannel(interaction, channel, enabled);
            const content = enabled ? 'Schedule added! Bot will check and post news updates every 1 hour/day.' : `Schedule of channel (${channel.name}) removed!`;
            await interaction.editReply({ ephemeral: false, content: content, fetchReply: true });
        } else {
            const date = interaction.options.getString('date');
            await retriveContent(channel, interaction.guild, date);
            await interaction.deleteReply();
        }

    } catch (e) {
        log.error(`Error execute wuwa news: ${e}`);
    }
};

const createChannel = async (interaction, channel, enabled) => {
    const query = { id: channel.id };
    const data = { $set: { id: channel.id, name: channel.name, guild: { id: interaction.guild.id, name: interaction.guild.name }, enabled: enabled} };
    const options = { upsert: true };
    // await updateOneData(COLLECTION_WUWE_CHANNEL, DATABASE_NAME_WUWE, query, data, options);
    await connection
        .setQuery(query)
        .setData(data)
        .setOptions(options)
        .setCollection(COLLECTION_WUWE_CHANNEL)
        .updateOneData();
};

const sendFooter = async (channel) => {
    await sleep(500);
    await channel.send({ content: '-----------------------' });
};

const retriveContent = async (channel, guild, date) => {
    const dateTimetamp = convertYMDStrToTimetamp(date);
    const newDate = new Date(dateTimetamp);
    newDate.setHours(0, 0, 0, 0);
    log.info("date %s", newDate.toDateString());

    const urlArticle = process.env.url_wuwa_acticle;
    const responseArticle = await fetch(urlArticle);
    const dataArticles = await responseArticle.json();
    // const channelPost = await findByCondition(COLLECTION_WUWE_CHANNEL, {channelId: channel.id}, DATABASE_NAME_WUWE);
    const dataPosted = await connection
        .setQuery({ channelId: channel.id })
        .setCollection(COLLECTION_WUWE_NEWS)
        .findByCondition();
    const dataArticleFilters = dataArticles
        .filter(x => convertStrToTimetamp(x.createTime) === newDate.getTime()
            && !dataPosted.some(p => p.articleId === x.articleId));
    // log.info('dataArticleFilters', dataArticleFilters);
    // log.info('dataPosted', dataPosted);
    if (dataArticleFilters && dataArticleFilters.length > 0) {
        // const dataArticle = dataArticleFilters[0];
        for (const dataArticle of dataArticleFilters) {
            const urlArticleDetail = `${process.env.url_wuwa_acticle_detail}/${dataArticle.articleId}.json`;

            const responseArticleDetail = await fetch(urlArticleDetail);
            const dataArticleDetail = await responseArticleDetail.json();
            // log.info('dataArticleDetail', dataArticleDetail)
            if (dataArticleDetail) {
                // log.info('call bot');

                const prompt = `Summarize the following content according to the timeline.
                Must follow these rules:
                1. Convert time from UTC+8 to GMT+7.
                2. No need to write GMT+7 for the entire content, only write it once in header.
                3. Add the content creation date in the header: ${dataArticleDetail?.startTime}
                4. If the content relates to a reward, write it concisely in the following format: Item (quantity) - method of receipt
                5. Group contents of the same day together
                6. Date format: yyyy/MM/dd HH:mm
                7. Keep the original language (English)
                8. Replace special characters code for HTML with normal characters (Ext: '&times;' must be 'x')
                9. Add footer source link: https://wutheringwaves.kurogames.com/en/main/news/detail/${dataArticleDetail?.articleId}
                10. Add header: ${dataArticleDetail?.articleTitle}.
                11. When content have url with an extension image. Ext: jpg, gif, etc. Do not add that content.
                12. Use markdown for content.
                Content: ${dataArticleDetail?.articleContent}`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                const array = responseText?.split("\n")?.filter(x => x && x.length > 0);
                log.info(`total length data resp: ${responseText.length}`);
                let dataMerge = "";
                for (const [index, content] of array.entries()) {
                    if (dataMerge.length + content.length <= CONTENT_MAX_LENGTH) {
                        dataMerge += content + "\n";
                    }

                    if (dataMerge.length + content.length > CONTENT_MAX_LENGTH || index === array.length - 1) {
                        // log.info(dataMerge);
                        log.info(`total length data sent: ${dataMerge.length}`);
                        if (![' \n', '', '**', '\n'].includes(dataMerge)) {
                            await sleep(500);
                            await channel.send({ content: dataMerge });
                        }
                        dataMerge = "";
                    }
                }
                await sendFooter(channel);

                // await insertOneData(COLLECTION_WUWE_NEWS, { articleId: dataArticleDetail?.articleId, channelId: channel.id }, DATABASE_NAME_WUWE);
                await connection
                    .setData({ articleId: dataArticleDetail?.articleId, channelId: channel.id })
                    .setCollection(COLLECTION_WUWE_NEWS)
                    .insertOneData();

                log.info(`data ${dataArticleDetail?.articleId} sent to server/channel ${guild.name}/${channel.name}`);
            }
        }
    } else {
        log.warn(`data ${newDate.toDateString()} not found`);
    }
};

let sleep = async (ms) => await new Promise(r => setTimeout(r, ms));

export { data, validate, execute, retriveContent };