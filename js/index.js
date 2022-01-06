import { utf8ToChar } from "./utf8ToCharacters.js";

Number.prototype.floor = function() {
    return Math.floor(this);
}
Number.prototype.ceil = function() {
    return Math.ceil(this);
}
Math.round = function(num, places = 1) {
    return (10**places*num+0.5).floor()/10**places;
}
const DAYS_IN_MONTHS = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
const MONTH_NAMES = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Septempber', 'October', 'November', 'December' ];
const MONTH_NAMES_SHORT = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

let allMessageObjects = null;
let totalFiles = null;

function onFileUpload(e) {
    totalFiles = e.target.files.length;
    for (const file of e.target.files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            let msgObject = JSON.parse(e.target.result);
            if (allMessageObjects == null) allMessageObjects = msgObject;
            else allMessageObjects.messages = [...allMessageObjects.messages, ...msgObject.messages];
        }
        reader.readAsText(file);
    }
    onFileLoad();
};
$('#upload-files').on('when-load-button-clicked', onFileUpload);
$('#upload-files').change(function(e) {
    let uploadLabel = $(this).parent().find('.upload-label');
    let files = e.target.files.length
    if (files) {
        uploadLabel.html(`${files} file(s) selected`);
    }
    else {
        uploadLabel.html('<strong>Choose files</strong> or drag them here');
    }
});
$('#process-files').on('click', function() {
    $(this).prop('disabled', true);
    $(this).html('Processing...');
    $('#upload-files').trigger('when-load-button-clicked');
    setTimeout(() => {
        $(this).prop('disabled', false);
        $(this).html('Process files');
    }, 2000);
});

/*
! sections:
//- general
//- users
- activity graphs //TODO remove certain months
- reactions
- calendar
- characters
*/

let participants = [];
let convoName;
let lastMessageDate;
let stats = {
    total: {
        total: 0,
        users: { /*
            joker876: 0,
            foo: 0,
            ...
            */
        },
    },
    first_message: {
        total: null,
        users: {},
    },
    unsent: {
        total: 0,
        users: {

        },
    },
    images: {
        total: 0,
        users: {

        },
    },
    videos: {
        total: 0,
        users: {

        },
    },
    audio: {
        total: 0,
        users: {

        },
    },
    gifs: {
        total: 0,
        users: {

        },
    },
    stickers: {
        total: 0,
        users: {},
    },
    files: {
        total: 0,
        users: {

        },
    },
    mentions: {
        total: 0,
        users: {

        },
    },
    links: {
        total: 0,
        users: {

        },
    },
    reactions: {
        total: 0,
        users: {},
        reactions: {
            /* 
            '❤': {
                total: 0,
                users: {},
            }
            */
        }
    },
    dates: {
        /*
        2021: {
            total: 0,
            users: {

            },
            months: [
                {
                    total: 0,
                    users: {

                    },
                    days: [
                        {
                            weekday: 'Fri',
                            total: 0,
                            users: {

                            }
                        }
                    ]
                }
            ]
        }
        */
    },
    hours: [],
    characters: {
        total: 0,
        users: {},
        characters: {
            /*
                new Character(letter? = false) {
                    total: 0,
                    uppercase: 0,
                    lowercase: 0,
                    users: {}
                }
            */
        },
    }
};
for (let i = 0; i < 24; i++) {
    stats.hours.push({
        total: 0,
        users: {},
        timespan: `${makeHour(i)}:00-${makeHour(i)}:59`
    });
}
function makeHour(num) {
    if (num.toString().length == 2) return num;
    return '0'+num;
}
let maxMessages;
let processedMessages = 0;

function onFileLoad() {
    setTimeout(() => {
        if (!allMessageObjects) return;
        hideUploadArea();
        maxMessages = allMessageObjects.messages.length;
    }, 1000);
}
function hideUploadArea() {
    $('.upload-container').addClass('hide-animation');
    setTimeout(() => {
        $('.upload-container').remove();
    }, 300);
    setTimeout(() => {
        $('.progress-container').removeClass('hidden').addClass('show-animation');
        $('.progress-container h3').html('Processing files...');
        resetProgressBar(totalFiles);
        setTimeout(() => {
            fakeProgress(totalFiles, 1000, 1000, processAllMessages);
        }, 300);
    }, 500);
}
function fakeProgress(maxValue, timePerItem, timeVariation, callback) {
    for (let i = 1; i <= maxValue+1; i++) {
        let curentAddedTime = Math.random()*timeVariation;
        setTimeout(() => {
            updateProgressBar(i-1, maxValue);
            if (i-1 == maxValue) setTimeout(() => {
                $('.progress-container h3').html('Reading messages...');
                resetProgressBar(maxMessages);
                setTimeout(() => {
                    callback();
                }, 300);
            }, 300);
        }, timePerItem*i+curentAddedTime);
    }
}
function resetProgressBar(newMax) {
    $('.progress .progressbar').css({ width: 0 });
    updateProgressBar(0, newMax);
}
function hideProgressBar() {
    $('.progress').addClass('hide-animation');
}
function hideProgress() {
    console.log('hide progress');
    $('.progress-container').addClass('hide-animation');
    setTimeout(() => {
        $('.progress-container').remove();
        $('.results-container').removeClass('hidden').addClass('show-animation');
    }, 500);
}
function updateProgressBar(value, max) {
    let width = (value/max*100)+'%';
    $('.progressbar').css({ width });
    $('#progress').html(`${value} / ${max}`);
}

const EMOJI_REGEX = /%f0%9f(?:%[0-9a-f]{2}){2}/i
const EMOJI_REGEX_2 = /%e2%9[0-9a-f](?:%[0-9a-f]{2}){2}/i
const SPECIAL_CHAR_REGEX = /((?:%[0-9a-f]{2}){2})/gi

function processAllMessages() {
    convoName = allMessageObjects.title;
    for (let i = 0; i < allMessageObjects.messages.length; i++) {
        setTimeout(() => {
            processedMessages++;
            updateProgressBar(processedMessages, maxMessages);
            let msg = allMessageObjects.messages[i];
            if (msg.type == "Subscribe") return;
            let author = msg.sender_name;
            let date = new Date(msg.timestamp_ms);
            
            addUserIfNeeded(author, date);
            addDate(date);
            addPointTotal(author, date); //!total, year, month, day, hour + user stats for each
            //! first&last message
            if (!stats.first_message.total || stats.first_message.total?.getTime() > date.getTime()){
                stats.first_message.total = date;
            }
            if (!stats.first_message.users[author] || stats.first_message.users[author]?.getTime() > date.getTime()) {
                stats.first_message.users[author] = date;
            }
            if (!lastMessageDate || lastMessageDate.getTime() < date.getTime()) lastMessageDate = date;
            //! unsent?
            if (msg.is_unsent) {
                addPoint('unsent', author); //unsent, user unsent
                return;
            }
            //! reactions
            if (msg.reactions) {
                stats.reactions.total += msg.reactions.length;
                for (const reaction of msg.reactions) {
                    addUserIfNeeded(reaction.actor);
                    addReactionIfNeeded(reaction.reaction);
                    addPointToReactions(reaction.reaction, reaction.actor);
                }
            }
            //! photos & videos
            if (msg.photos || msg.videos) {
                //! photos
                if (msg.photos) {
                    addPoint('images', author, msg.photos.length);
                }
                //! videos
                if (msg.videos) {
                    addPoint('videos', author, msg.videos.length);
                }
                return;
            }
            //! audio
            if (msg.audio_files) {
                addPoint('audio', author, msg.audio_files.length);
                return;
            }
            //! gifs
            if (msg.gifs) {
                addPoint('gifs', author, msg.gifs.length);
                return;
            }
            //! stickers
            if (msg.sticker) {
                addPoint('stickers', author);
                return;
            }
            //! files
            if (msg.files) {
                addPoint('files', author, msg.files.length);
                return;
            }
            //! mentions
            let mentions = msg.content?.match(/^@[a-z]|\s@[a-z]/ig)
            if (mentions?.length) {
                addPoint('mentions', author, mentions.length);
            }
            //! links
            let links = msg.content?.match(/https?:\/\//g);
            if (links?.length) {
                addPoint('links', author, links.length);
            }
            //! characters
            let escapedContent = escape(msg.content);
            //remove emojis
            escapedContent = escapedContent.replace(EMOJI_REGEX, '').replace(EMOJI_REGEX_2, '');
            //convert utf to chars
            escapedContent = escapedContent.replace(/%20/g, ' ');
            if (escapedContent.match(SPECIAL_CHAR_REGEX)) {
                escapedContent = escapedContent.replace(SPECIAL_CHAR_REGEX, str => utf8ToChar(str));
            }
            //count characters
            for (const char of escapedContent.split('')) {
                addCharacterIfNeeded(char);
                addPointToCharacters(char, author);
            }
        }, 25);
    }
    let completionCheck = setInterval(() => {
        if (maxMessages > processedMessages) return;
        clearInterval(completionCheck);
        setTimeout(() => {
            $('.progress-container h3').html('Generating results...');
            hideProgressBar();
            setTimeout(() => {
                generateInfoDisplays();
                hideProgress();
            }, 1500);
        }, 300);
    }, 100);
}
function addCharacterIfNeeded(char) {
    char = char.toUpperCase();
    if (stats.characters.characters[char]) return;
    stats.characters.characters[char] = new Character(char);
}
function addReactionIfNeeded(reaction) {
    if (stats.reactions.reactions[reaction]) return;
    stats.reactions.reactions[reaction] = {
        total: 0,
        users: {},
        symbol: utf8ToChar(escape(reaction)),
    }
    for (const user of participants) {
        stats.reactions.reactions[reaction].users[user] = 0;
    }
}
function addUserIfNeeded(user) {
    if (participants.includes(user)) return;
    participants.push(user);
    stats.total.users[user] = 0;
    stats.unsent.users[user] = 0;
    stats.images.users[user] = 0;
    stats.videos.users[user] = 0;
    stats.audio.users[user] = 0;
    stats.gifs.users[user] = 0;
    stats.stickers.users[user] = 0;
    stats.mentions.users[user] = 0;
    stats.links.users[user] = 0;
    stats.reactions.users[user] = 0;
    for (const reaction in stats.reactions.reactions) {
        const reactionObj = stats.reactions.reactions[reaction];
        reactionObj.users[user] = 0;
    }
    for (const year in stats.dates) {
        const yearObj = stats.dates[year];
        yearObj.users[user] = 0;
        for (const monthObj of yearObj.months) {
            monthObj.users[user] = 0;
            for (const dayObj of monthObj.days) {
                dayObj.users[user] = 0;
            }
        }
    }
    for (const hourObj of stats.hours) {
        hourObj.users[user] = 0;
    }
    stats.characters.users[user] = 0;
    for (const char in stats.characters.characters) {
        const charObj = stats.characters.characters[char];
        charObj.users[user] = 0;
    }
}
function addDate(date) {
    const year = date.getFullYear();
    if (stats.dates[year]) return;
    let yearObj = {
        total: 0,
        users: {},
        months: [],
    }
    for (const user of participants) {
        yearObj.users[user] = 0;
    }
    for (const monthNum in DAYS_IN_MONTHS) {
        let numberOfDays = DAYS_IN_MONTHS[monthNum];
        let isLeapYear = isYearLeap(year);
        if (numberOfDays == 28 && isLeapYear) numberOfDays++;
        let monthArtificialDate = new Date(`1 ${MONTH_NAMES_SHORT[monthNum]} ${year}`)
        let monthObj = {
            total: 0,
            users: {},
            days: generateDaysArray(numberOfDays),
            firstWeekday: monthArtificialDate.getDay(),
        };
        for (const user of participants) {
            monthObj.users[user] = 0;
        }
        yearObj.months.push(monthObj);
    }
    stats.dates[year] = yearObj;
}
function generateDaysArray(amount) {
    let arr = [];
    for (let i = 0; i < amount; i++) {
        let obj = {
            total: 0,
            users: {}
        }
        for (const user of participants) {
            obj.users[user] = 0;
        }
        arr.push(obj);
    }
    return arr;
}
function isYearLeap(year)
{
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}
function addPointTotal(user, date) {
    stats.total.total++;
    stats.total.users[user]++;
    //add to dates
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let yearObj = stats.dates[year];
    yearObj.total++;
    yearObj.users[user]++;
    let monthObj = yearObj.months[month];
    monthObj.total++;
    monthObj.users[user]++;
    let dayObj = monthObj.days[day-1];
    dayObj.total++;
    dayObj.users[user]++;
    //add to hours
    let hour = date.getHours();
    let hourObj = stats.hours[hour];
    hourObj.total++;
    hourObj.users[user]++;
}
function addPoint(stat, user, amount = 1) {
    stats[stat].total += amount;
    stats[stat].users[user] += amount;
}
function addPointToReactions(reaction, user) {
    stats.reactions.users[user]++;
    stats.reactions.reactions[reaction].total++;
    stats.reactions.reactions[reaction].users[user]++;
}
function addPointToCharacters(char, user) {
    let charKey = char.toUpperCase();
    stats.characters.total++;
    stats.characters.users[user]++;
    stats.characters.characters[charKey].addPoint(char, user);
    // console.log(char, user);
}
class Character {
    constructor(char) {
        this.char = char.toUpperCase();
        this.charHtml = this.char;
        if (/\s/.test(this.char)) this.charHtml = `"${this.char}"`;
        this.determineIfIsLetter()
        this.total = 0;
        this.users = {};
        for (const user of participants) {
            this.users[user] = 0;
        }
        if (this.isLetter) {
            this.lowercase = 0;
            this.uppercase = 0;
        }
    }
    determineIfIsLetter() {
        this.isLetter = this.char.toLowerCase() != this.char;
    }
    addPoint(character, user) {
        this.total++;
        this.users[user]++;
        if (this.isLetter) {
            if (character == this.char) {
                this.uppercase++;
            }
            else {
                this.lowercase++;
            }
        }
    }
}
function generateInfoDisplays() {
    //conversation name
    $('#convo-title').html(convoName);
    //general stats
    generateUserButton('Overall', true).prependTo('.userlist').trigger('click');
    for (const user of participants) {
        generateUserButton(user).appendTo('.userlist');
    }
    //hour stats
    let hoursGraph = new ColumnGraph({ verticalLabels: true });
    for (const hourData of stats.hours) {
        hoursGraph.addColumn({ label: hourData.timespan, value: hourData.total });
    }
    hoursGraph.toJqueryObj().appendTo('#hour-container');
    //remove unwanted months and days
    let firstYear = stats.first_message.total.getFullYear();
    let firstMonth = stats.first_message.total.getMonth();
    let firstDay = stats.first_message.total.getDate();
    let lastYear = lastMessageDate.getFullYear();
    let lastMonth = lastMessageDate.getMonth();
    let lastDay = lastMessageDate.getDate();
    let firstMonthsList = stats.dates[firstYear].months;
    let lastMonthsList = stats.dates[lastYear].months;
    let firstDayList = firstMonthsList[firstMonth].days;
    let lastDayList = lastMonthsList[lastMonth].days;
    for (let i = 0; i < firstMonth; i++) {
        firstMonthsList[i] = { blank: true };
    }
    for (let i = 11; i > lastMonth; i--) {
        lastMonthsList[i] = { blank: true };
    }
    for (let i = 0; i < firstDay; i++) {
        firstDayList[i] = { blank: true };
    }
    for (let i = 30; i > lastDay; i--) {
        if (!lastDayList[i]) return;
        lastDayList[i] = { blank: true };
    }
    //month stats
    let monthGraph = new ColumnGraph({ verticalLabels: true, sort: false, addIds: true });
    for (const year in stats.dates) {
        const yearObj = stats.dates[year];
        for (const monthNum in yearObj.months) {
            const monthObj = yearObj.months[monthNum];
            if (monthObj.blank) continue;
            let colData = {
                label: `${MONTH_NAMES_SHORT[monthNum]}, ${year}`,
                value: monthObj.total,
                id:MONTH_NAMES_SHORT[monthNum]+year,
            }
            if (monthNum == 11) colData.class = "last-of-year";
            monthGraph.addColumn(colData);
        }
    }
    monthGraph.toJqueryObj().appendTo('#month-container');
    //calendar
    let lastObj;
    for (const year in stats.dates) {
        const yearObj = stats.dates[year];
        for (const monthNum in yearObj.months) {
            const monthObj = yearObj.months[monthNum];
            if (monthObj.blank) continue;
            let id = MONTH_NAMES_SHORT[monthNum] + year;
            lastObj = $(`#${id}`);
            $(`#${id}`).click(() => {
                $('#calendar-title').html(`${MONTH_NAMES[monthNum]}, ${year}`);
                generateCalendar(monthObj);
            });
        }
    }
    lastObj.trigger('click');
    //ranking
    let userList = [];
    for (const user in stats.total.users) {
        let username = escape(user);
        username = username.replace(/%20/g, ' ');
        if (username.match(SPECIAL_CHAR_REGEX)) {
            username = username.replace(SPECIAL_CHAR_REGEX, s => utf8ToChar(s));
        }
        const value = stats.total.users[user];
        userList.push({ username, value })
    }
    userList.sort((a, b) => b.value - a.value);
    let ranking = $('#ranking');
    for (const userPlace in userList) {
        let user = userList[userPlace];
        ranking.append($(`
            <span class="username">
                <span class="num">${Number(userPlace)+1}.</span>
                ${user.username}
            </span>
            <span class="count">${addThousandSep(user.value)}</span>
            <span class="percent">${getPercentOfTotal(user.value, undefined, 1)}</span>
        `));
    }
    //most messages in one day
    let mostMessages = [];
    for (const year in stats.dates) {
        const yearObj = stats.dates[year];
        for (const monthNum in yearObj.months) {
            const monthObj = yearObj.months[monthNum];
            if (monthObj.blank) continue;
            for (const dayNum in monthObj.days) {
                const dayObj = monthObj.days[dayNum];
                if (dayObj.blank) continue;
                mostMessages.push({
                    value: dayObj.total,
                    date: `<span class="date">${MONTH_NAMES_SHORT[monthNum]} ${Number(dayNum)+1}</span><br/><span class="year">${year}</span>`,
                });
            }
        }
    }
    mostMessages.sort((a, b) => b.value - a.value);
    $('#top-messages-total1').html(mostMessages[0].value);
    $('#top-messages-date1').html(mostMessages[0].date);
    $('#top-messages-total2').html(mostMessages[1].value);
    $('#top-messages-date2').html(mostMessages[1].date);
    $('#top-messages-total3').html(mostMessages[2].value);
    $('#top-messages-date3').html(mostMessages[2].date);
    //average messages in one day
    let totalDays = 0;
    let bestAverage = 0;
    let bestAverageDate;
    for (const year in stats.dates) {
        const yearObj = stats.dates[year];
        for (const monthNum in yearObj.months) {
            const monthObj = yearObj.months[monthNum];
            if (monthObj.blank) continue;
            let days = [...monthObj.days];
            days = days.filter(v => !v.blank);
            totalDays += days.length;
            let monthAverage = monthObj.total/days.length;
            if (bestAverage < monthAverage) {
                bestAverage = monthAverage;
                bestAverageDate = `${MONTH_NAMES[monthNum]}, ${year}`;
            }
        }
    }
    $('#avg-messages-total').html(Math.round(stats.total.total/totalDays, 1));
    $('#avg-messages-best').html(Math.round(bestAverage, 1));
    $('#avg-messages-best-date').html(bestAverageDate);
    //average characters per message
    $('#avg-chars').html(Math.round(stats.characters.total/stats.total.total, 1));

    console.log(stats);
}
function generateUserButton(user, total = false) {
    let username = escape(user);
    username = username.replace(/%20/g, ' ');
    if (username.match(SPECIAL_CHAR_REGEX)) {
        username = username.replace(SPECIAL_CHAR_REGEX, s => utf8ToChar(s));
    }
    let buttonEl = $(`<span class="user-button">
        <img src="./img/${total ? 'people' : 'person'}.svg">
        <span>${username}</span>
    </span>`);
    buttonEl.click(function() {
        //button highlight
        $(this).parent().children().removeClass('active');
        $(this).addClass('active');
        //stats
        $('#general-total').html(addThousandSep(getData(stats.total)));
        $('#general-first-date').html(formatDate(getData(stats.first_message)));
        $('#general-first-hour').html(formatHour(getData(stats.first_message)));
        $('#general-images').html(addThousandSep(getData(stats.images)));
        $('#general-videos').html(addThousandSep(getData(stats.videos)));
        $('#general-audio').html(addThousandSep(getData(stats.audio)));
        $('#general-stickers').html(addThousandSep(getData(stats.stickers)));
        $('#general-reactions').html(addThousandSep(getData(stats.reactions)));
        $('#general-unsent').html(addThousandSep(getData(stats.unsent)));
        $('#general-mentions').html(addThousandSep(getData(stats.mentions)));
        $('#general-links').html(addThousandSep(getData(stats.links)));
        $('#general-gifs').html(addThousandSep(getData(stats.gifs)));
        $('#general-files').html(addThousandSep(getData(stats.files)));
        let allReactions = [...Object.values(stats.reactions.reactions)];
        allReactions.sort((a, b) => {
            return getData(b) - getData(a);
        });
        $('#top-reactions-container .list-row').remove();
        for (let i = 0; i < 10; i++) {
            let reactionObj = allReactions[i];
            let row = $('<div class="list-row"></div>');
            row.append(`<span class="symbol">${reactionObj.symbol}</span>`);
            row.append(`<span class="count">${addThousandSep(getData(reactionObj))}</span>`);
            row.append(`<span class="percent">${getPercentOfTotal(
                getData(reactionObj),
                total ? stats.reactions.total : reactionObj.total,
                1
            )}</span>`);
            $('#top-reactions-container').append(row);
        }
        let allCharacters = [...Object.values(stats.characters.characters)];
        allCharacters.sort((a, b) => {
            return getData(b) - getData(a);
        });
        $('#top-characters-container .list-row').remove();
        for (let i = 0; i < 10; i++) {
            let charObj = allCharacters[i];
            let row = $('<div class="list-row"></div>');
            row.append(`<span class="symbol">${charObj.charHtml}</span>`);
            row.append(`<span class="count">${addThousandSep(getData(charObj))}</span>`);
            row.append(`<span class="percent">${getPercentOfTotal(
                getData(charObj),
                total ? stats.characters.total : charObj.total,
                1
            )}</span>`);
            $('#top-characters-container').append(row);
        }
    });
    function getData(obj) {
        if (total) return obj.total || 0;
        return obj.users[user] || 0;
    }
    return buttonEl;
}
function generateCalendar(monthObj) {
    let calendar = $('#calendar-box');
    calendar.children()?.remove()
    for (let i = 1; i < monthObj.firstWeekday; i++) {
        calendar.append($('<div class="calendar-item"></div>'));
    }
    for (let i = 0; i < monthObj.days.length; i++) {
        let calendarItem = $('<div class="calendar-item filled"></div>');
        calendar.append(calendarItem);
        calendarItem.append(`<span class="day-num">${i+1}</span>`);
        if (monthObj.days[i].blank) {
            calendarItem.append(`<span class="day-total unknown">?</span>`);
            continue;
        }
        calendarItem.append(`<span class="day-total">${addThousandSep(monthObj.days[i].total)}</span>`);
    }
}
function getPercentOfTotal(value, totalRef = stats.total.total, roundPlaces = 3) {
    value = value || 0;
    let rawValue = value/totalRef*100;
    let roundedValue = Math.round(rawValue, roundPlaces);
    while (roundedValue == 0 && roundPlaces < 5) {
        roundPlaces++;
        roundedValue = Math.round(rawValue, roundPlaces);
    }
    return roundedValue+'%';
}
function addThousandSep(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function formatDate(date) {
    return `${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
function formatHour(date) {
    return date.toTimeString().slice(0, 8);
}
class ColumnGraph {
    constructor({ verticalLabels = false, alternatingLabels = true, sort = true, min, max, addIds = false }) {
        this.min = min ?? 0 /*Infinity*/;
        this.max = max ?? -Infinity;
        this.sort = sort;
        this.addIds = addIds;
        this.classes = [];
        if (verticalLabels) this.classes.push('vertical-labels');
        if (!verticalLabels && alternatingLabels) this.classes.push('alternating-labels');
        this.columns = [];
    }
    addColumn(colData) {
        // if (colData.value < this.min) this.min = colData.value;
        if (colData.value > this.max) this.max = colData.value;
        this.columns.push(colData);
    }
    toJqueryObj() {
        let ret = $(`<div class="graph column ${this.classes.join(' ')}">
            <div class="axis-y">
                <span>${addThousandSep(this.max)}</span>
                <span>${addThousandSep(this.min)}</span>
            </div>
            <div class="graph-area" style="--column-count: ${this.columns.length}"><hr><hr></div>
        </div>`);
        let graphArea = ret.find('.graph-area');
        if (this.sort) {
            this.columns.sort((a, b) => {
                if (a.label < b.label) return -1;
                if (a.label > b.label) return 1;
                return 0;
            });
        }
        for (let col of this.columns) {
            let column = $(`<div tabindex="0" class="column-container" ${this.addIds ? 'id="'+col.id+'"' : ''}>
            <div class="column" style="height: ${this.determineColumnHeight(col.value)}">
                <span class="column-value">${addThousandSep(col.value)}</span>
            </div>
            <label>${col.label}</label>
        </div>`)
            graphArea.append(column);
            if (col.class) column.addClass(col.class);
            column.click(function() {
                this.focus();
            })
        }
        return ret;
    }
    determineColumnHeight(value) {
        let totalSpan = Math.abs(this.min - this.max);
        let fromMin = Math.abs(this.min - value);
        let percent = Math.round(fromMin/totalSpan*100, 4);
        return `${percent}%`;
    }
}