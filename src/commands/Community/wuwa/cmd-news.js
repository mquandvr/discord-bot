import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord.js';
import { convertStrToTimetamp, convertYMDStrToTimetamp } from '../../../utils/date.js';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { findAll, insertOneData, updateOneData } from '../../../database.js';
import { COLLECTION_WUWE_CHANNEL, COLLECTION_WUWE_NEWS, DATABASE_NAME_WUWE } from '../../../utils/constants.js';

var aiCode = process.env.ai_code;
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
    .addBooleanOption(option =>
        option.setName("schedule")
            .setDescription("Enable the bot to send news on 1 time / 1 hour.")
            .setRequired(false)
    );

const execute = async (interaction, client) => {
    try {
        // const schedule = interaction.options.getChannel('schedule');
        //await interaction.reply({ ephemeral: false, content: 'Waiting', fetchReply: true });

        const isSchedule = interaction.options.getBoolean('schedule');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const date = interaction.options.getString('date');
        if (date && !isNaN(new Date(date))) {
            console.log("Error format date");
            await interaction.editReply({ content: 'Wrong format date (yyyyMMdd)!.' });
            return;
        }

        if (isSchedule) {
            await createChannel(channel);
            await interaction.editReply({ ephemeral: false, content: 'Schedule added!', fetchReply: true });
        } else {
            await retriveContent(channel, date);
            await interaction.deleteReply();
        }

    } catch (e) {
        console.log(e);
        await interaction.editReply({ ephemeral: false, content: 'Error!', fetchReply: true });
    }
}

const autocomplete = async () => {

}

const createChannel = async (channel) => {
    const query = {id: channel.id};
    const update = { $set: {id: channel.id, name: channel.name}};
    const options = {upsert: true};
    await updateOneData(COLLECTION_WUWE_CHANNEL, DATABASE_NAME_WUWE, query, update, options);
}

const sendFooter = async (channel) => {
    await sleep(500);
    await channel.send({content: '-----------------------'});
}

const retriveContent = async (channel, date) => {
    const dateTimetamp = convertYMDStrToTimetamp(date);
    const newDate = new Date(dateTimetamp);
    newDate.setHours(0, 0, 0, 0);
    console.log("date", newDate);

    const urlArticle = "https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/ArticleMenu.json";
    const responseArticle = await fetch(urlArticle);
    const dataArticles = await responseArticle.json();
    const dataPosted = await findAll(COLLECTION_WUWE_NEWS, DATABASE_NAME_WUWE);
    const dataArticleFilters = dataArticles
        .filter(x => convertStrToTimetamp(x.createTime) === newDate.getTime()
            && !dataPosted.some(p => p.articleId === x.articleId && p.channelId === channel.id));
    // console.log('dataArticleFilters', dataArticleFilters);
    // console.log('dataPosted', dataPosted);
    if (dataArticleFilters && dataArticleFilters.length > 0) {
        // const dataArticle = dataArticleFilters[0];
        for (const dataArticle of dataArticleFilters) {
            const urlArticleDetail = `https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/article/${dataArticle.articleId}.json`;

            const responseArticleDetail = await fetch(urlArticleDetail);
            const dataArticleDetail = await responseArticleDetail.json();
            // console.log('dataArticleDetail', dataArticleDetail)
            if (dataArticleDetail) {
                // console.log('call bot');

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
                10. Add header: ${dataArticleDetail?.articleTitle}. End of header add text: [END] to last line
                11. In group of date, add text: [END] to the beginning line
                12. When content have url with an extension image. Ext: jpg, gif, etc. Do not add that content.
                Content: ${dataArticleDetail?.articleContent}`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                const array = responseText?.split("[END]")?.filter(x => x && x.length > 0);
                // console.log(array);
                for (let content of array) {
                    const cntContentPerSent = Math.ceil(content.length / CONTENT_MAX_LENGTH);
                    // console.log("content", content.length)
                    for (let i = 0; i < cntContentPerSent; i++) {
                        const data = content.substring(0, CONTENT_MAX_LENGTH);
                        const lastIndexMatchedRegex = getLastIndexMatched(data);
                        let dataMatched = "";
                        // console.log("lastIndexMatchedRegex", lastIndexMatchedRegex)
                        if (lastIndexMatchedRegex < CONTENT_MAX_LENGTH && cntContentPerSent > 1) {
                            dataMatched = content.substring(0, lastIndexMatchedRegex).trim();
                            // console.log("dataMatched", dataMatched);
                            const temp = content.substring(lastIndexMatchedRegex, CONTENT_MAX_LENGTH);
                            // console.log("temp", temp);
                            content = temp + content.substring(CONTENT_MAX_LENGTH);
                        } else {
                            dataMatched = data.trim();
                            content = content.substring(CONTENT_MAX_LENGTH);
                        }
                        // console.log("dataMatched", dataMatched);
                        // console.log("dataMatched length", dataMatched.length);
                        if (![' \n', '', '**', '\n'].includes(dataMatched)) {
                            await sleep(500);
                            await channel.send({ content: dataMatched });
                        }
                    }
                }
                await sendFooter(channel);

                await insertOneData(COLLECTION_WUWE_NEWS, { articleId: dataArticleDetail?.articleId, channelId: channel.id }, DATABASE_NAME_WUWE);

                console.log(`data ${dataArticleDetail?.articleId} sent to ${channel.name}`);
            }
        }
    } else {
        console.log(`data ${newDate} not found`);
    }
};
``
let sleep = async (ms) => await new Promise(r => setTimeout(r, ms));

const getLastIndexMatched = (data) => {
    const regex = /(\r\n|\r|\n)/g;
    let match;
    let lastIndex = -1;

    while ((match = regex.exec(data)) !== null) {
        lastIndex = match.index + match[0].length;
    }

    return lastIndex;
}

export { data, autocomplete, execute, retriveContent };