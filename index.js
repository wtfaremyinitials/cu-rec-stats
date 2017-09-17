const got = require('got')
const cheerio = require('cheerio')
const { delay } = require('awaiting')

const INTERVAL = 15 * (60 * 1000) // 15 minutes
const SERVER = 'www.connect2concepts.com'
const PATH = '/connect2/?type=circle&key=11EEE07F-7BED-418E-B7F7-547D2BB046F5'

async function main() {
    while (true) {
        var data = await check()
        var csv = toCsv(data)
        process.stdout.write(csv)

        await delay(INTERVAL)
    }
}

async function check() {
    var response = await got(SERVER + PATH)
    var $ = cheerio.load(response.body)

    return $('div.col-md-3.col-sm-6')
        .map((i, el) => {
            var percent = $(el)
                .find('div:nth-child(1)')
                .attr('data-percent')
            var text = $(el)
                .find('div:nth-child(2)')
                .html()
            var [title, count, updated] = text.split('<br>')

            percent = Number(percent)
            title = title.replace('&amp;', '&')
            count = Number(count.match(/Last Count: (\d+)/)[1])
            updated = new Date(updated.match(/Updated: (.+)/)[1])

            return { title, count, percent, updated }
        })
        .get()
}

function toCsv(data) {
    var ts = new Date().toISOString()
    // Timestamp,Title,Count,Percent,Updated\n
    return data
        .map(entry => {
            var { title, count, percent, updated } = entry
            updated = updated.toISOString()
            return [ts, title, count, percent, updated].join(',') + '\n'
        })
        .join('')
}

main().then(console.log, console.error)
