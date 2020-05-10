let puppeteer = require('puppeteer')
let fs = require('fs')
let methods = require("./generateHTML.js");
let Src = process.argv[2]
let Dest = process.argv[3]
let top, bottom , right , left
let MainHtml
if(Src === "-")
    Src = "Current Location"

let commutes = {}
let commuteDetails = []
let paths = []
initiate()
async function initiate() {
    try {

        let browser = await puppeteer.launch({
            headless : false,
            defaultViewport : null,
            args : ['--disable-notifications' , '--start-maximised' , '--start-fullscreen']  // '--start-fullscreen'
        })

        pages = await browser.pages()
        page = pages[0]
        
        await page.goto("https://www.google.com/")
        const context = browser.defaultBrowserContext();
        await context.overridePermissions('https://www.google.com/', ['geolocation'])

        await page.waitForSelector('input[title=Search]',{visible : true})
        let S = " From " + Src
        let D = " To " + Dest
        await page.type('input[title=Search]', `Directions ${S} ${D} : Google Maps`)
        await page.click('.FPdoLc.tfB0Bf input[name=btnK]')
        //await page.waitForNavigation({waitUntil: 'networkidle0'})
        await page.waitForSelector('.mGSxre.Ra9ql',{visible : true})
        paths = await page.$$('.mGSxre.Ra9ql')
        await page.click('div#exp0 .mGSxre.Ra9ql a')
       // await page.setDefaultNavigationTimeout(0);
        await page.waitForSelector('div.section-directions-trip.clearfix',{visible: true})
        let arr = await page.$$('div.section-directions-trip.clearfix')

        await page.waitForSelector('canvas.widget-scene-canvas',{visible: true})
        const header = await page.$('canvas.widget-scene-canvas');
        const rect = await page.evaluate((header) => {
          const {top, left, bottom, right} = header.getBoundingClientRect();
          return {top, left, bottom, right};
        }, header);
        
        const bar = await page.$('div#omnibox-directions');
        const barD = await page.evaluate((bar) => {
            const {top, left, bottom, right} = bar.getBoundingClientRect();
            return {top, left, bottom, right};
          }, bar);

        top = rect.top 
        bottom = rect.bottom
        left = barD.right
        right = rect.right

        for (let i = 0 ; i < arr.length; i++)
        {
            console.log("Fetching data from source " + i + " ...");
            let name = await(await arr[i].$("div.section-directions-trip-description h1.section-directions-trip-title")).getProperty("textContent")
            name = await name.jsonValue()
            let summary = await(await arr[i].$("div.section-directions-trip-description div.section-directions-trip-summary")).getProperty("textContent")
            summary = await summary.jsonValue()
            let details = await(await arr[i].$("div.section-directions-trip-description div.section-directions-trip-numbers")).getProperty("textContent")
            details = await details.jsonValue()
            await arr[i].click()
            if(i != 0)
            {
            await page.waitForSelector('button[aria-labelledby=section-directions-trip-details-msg-'+i+']',{visible : true})
            await page.click('button[aria-labelledby=section-directions-trip-details-msg-'+i+']')
            }
            let object = {}
            object.name = name.trim()
            object.summary = summary.trim()
            object.details = details.replace("  Arrive around    Leave around  ","").trim()
            object.directions = await getDirections()
            commuteDetails.push(object)
            await page.screenshot(getOptions(i))
            object.map = './Images/screenshot'+i+'.png'
            await page.waitForSelector('button.section-trip-header-back',{visible: true})
            await page.click("button.section-trip-header-back")
            await page.waitForSelector('div.section-directions-trip.clearfix',{visible: true})
            arr = await page.$$('div.section-directions-trip.clearfix')
        }
        console.log("Data Fetched.");
        commutes.routes = commuteDetails
        await fs.promises.writeFile('Directions.json', JSON.stringify(commuteDetails));


        console.log("Compiling data...")
        MainHtml = methods(" Routes from " + Src + " to " + Dest)
        await fs.promises.writeFile('Html.html', MainHtml);
        console.log('Exporting to PDF...')
        let path = __dirname
        path = path.split('\\').join('/');

        await page.goto('file://'+ path +'/Html.html',{ waitUntil: 'networkidle0' })
        await generatePDF()
       // browser.close()

        console.log("Completed.")

    }catch(err)
    {
        console.log(err)
    }
}

async function getDirections()
{
    try
    {
        let route = []
        await page.waitForSelector('div.directions-mode-nontransit-groups', {visible : true})
        let divs = await page.$$('div.directions-mode-nontransit-groups div.directions-mode-group')
        let j = 0
        while(j < divs.length)
        {
            let obj = {}
            let sap,div,h2,extra
            let cls = await ( await divs[j].getProperty('className') ).jsonValue()
            if(String(cls).includes("closed"))
            {
                h2 = await divs[j].$("div.directions-mode-group-summary h2.directions-mode-group-title")
                h2 = await ( await h2.getProperty('textContent') ).jsonValue()
                sap = await divs[j].$("div.directions-mode-group-summary div.directions-mode-separator")
                sap = await ( await sap.getProperty('textContent') ).jsonValue()
                obj.heading = h2.trim()
                obj.details = sap.trim()
                await divs[j].click()
                obj.steps = await getSteps(divs[j])
            }
            else
            {
                div = await divs[j].$(" div.directions-mode-step-container div.directions-mode-step-summary div.numbered-step")
                div = await ( await div.getProperty('textContent') ).jsonValue()
                extra = await divs[j].$(" div.directions-mode-step-container div.directions-mode-step-summary div.dirsegnote")
                extra = await ( await extra.getProperty('textContent') ).jsonValue()
                sap = await divs[j].$("div.directions-mode-step div.directions-mode-separator")
                sap = await ( await sap.getProperty('textContent') ).jsonValue()
                obj.heading = div.trim()
                obj.details = sap.trim()
                if(extra != null && extra.trim().length > 0)
                obj.extra = extra.replace("Confidential","").trim()
                
            }

            j++
            route.push(obj)

        }

        return route
    }
    catch(err)
    {
        console.log(err)
    }
}

async function getSteps(div)
{
    try{
        let arr = []
        steps = await div.$$("div.hideable.expand-print.padded-hideable div.directions-mode-step-container ")
        let i = 0
        while(i < steps.length)
        {
            let div , sap , extra
            let obj = {}
            div = await steps[i].$(" div.directions-mode-step-summary div.numbered-step")
            div = await ( await div.getProperty('textContent') ).jsonValue()
            extra = await steps[i].$(" div.directions-mode-step-summary div.dirsegnote")
            extra = await ( await extra.getProperty('textContent') ).jsonValue()
            sap = await steps[i].$$("div.directions-mode-separator")
            sap = await ( await sap[1].getProperty('textContent') ).jsonValue()
            obj.heading = div.trim()
            obj.details = sap.trim()
            if(extra != null && extra.trim().length > 0)
            obj.extra = extra.replace("Confidential","").trim()
            arr.push(obj)
            i++
        }

        return arr
    }
    catch(err)
    {
        console.log(err)
    }
}
function getOptions(i)
{
    if (!fs.existsSync('./Images')){
        fs.mkdirSync('./Images')
    }
let options = {
    path: './Images/screenshot'+i+'.png',  // set's the name of the output image'
    fullPage: false,
    // dimension to capture
    clip: {      
        x: left,  // x coordinate
        y: top,   // y coordinate
        width: right,      // width
        height: bottom  // height
    },
    omitBackground: true
  }
return options
}

async function generatePDF() {

    try
    {
    const pdfConfig = {
        path: 'MAP.pdf', // Saves pdf to disk. 
        format: 'A4',
        printBackground: true,
        margin: { // Word's default A4 margins
            top: '2.54cm',
            bottom: '2.54cm',
            left: '2.54cm',
            right: '2.54cm'
        }
    };
    await page.emulateMedia('screen');
    const pdf = await page.pdf(pdfConfig); // Return the pdf buffer. Useful for saving the file not to disk. 
    return pdf
    }
    catch(err)
    {
        console.log(err)
    }
}