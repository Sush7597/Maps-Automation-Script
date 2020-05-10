let path = require('path');
let fs = require('fs');
let Src = process.argv[2]
let Dest = process.argv[3]
let MainHtml = ""
module.exports = function (data) {
let MetaData = fs.readFileSync('./Directions.json');
let log = JSON.parse(MetaData);
MainHtml += " <html>   <head> <title> MAP </title> "
MainHtml += " <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'> " 
MainHtml += " <script src='https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'></script> "
MainHtml += " <script src='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'></script> "
MainHtml += " <meta name='viewport' content='width=device-width, initial-scale=1'> "
MainHtml += " <link rel='stylesheet' href='index.css' type='text/css'> "
MainHtml += " </head> "
MainHtml += " <body> " 
MainHtml += " <div class='container' style = 'margin-top : 5%; margin-bottom : 5%'> "

MainHtml += " <center> <h1 style = 'font-size : 60px'><b> "  + data + "</b></h1> </center> "
MainHtml += "<div style = 'margin-top : 5%; margin-bottom : 5%;'>"
MainHtml += "<h2> There are total " + log.length + " routes : </h2>"
MainHtml += "<ol class='c'>"
for(let i = 0  ; i < log.length ; i++)
{
    const nameCapitalized = log[i].name.charAt(0).toUpperCase() + log[i].name.slice(1)
    log[i].name = nameCapitalized
    MainHtml += "<h3> <li>" + nameCapitalized + " </li> </h3>"
}
MainHtml += "</ol></div><hr>"
for(let i = 0 ; i < log.length ; i++)
{
    MainHtml += "<div class='row row_style'>"
	MainHtml += "<div class='col-xs-12' style = 'margin-top : 2%;'>"
	MainHtml += "<div class='panel panel-default'>"
    Initial(log[i], i)    
    MainHtml += "</div></div></div><hr class = 'style-one'>"
    
}


MainHtml += " </div> </body> </html>"
return MainHtml

}

function Initial(data , i)
{
    i = i + 1
    MainHtml += "<div class='panel-heading'>"
    MainHtml += "<center><h2>  Route " + i + " : " + data.name + "</h2> </div>  </center>"
    let details = data.details.split("     ")
    MainHtml += "<div class='panel-body'> <center>"
    MainHtml += "<h3> ETA - " + details[0] + "</h3>"
    MainHtml += "<h3> Distance - " + details[1] + "</h3>"
    MainHtml += "<img src = '" + data.map + "'>"
    MainHtml += "<h4 style = 'margin : 3%'> Summary : " + data.summary + "</h4>  </center>"

    let log = data.directions

    for(let i = 0 ; i < log.length ; i++)
    {
        MainHtml += "<div style = 'margin : 2%'>"
        level1(log[i])
        MainHtml += "</div><hr class = 'style-two'>"
    }

    MainHtml += "</div>"
}

function level1(data)
{
    MainHtml += "<div style = 'margin : 2%'> <ul>"
    MainHtml += "<h3><li>" + data.heading + "</li></h3>"
    MainHtml += "<h4 style = 'margin-left : 2%'><i>" + data.details + "</i></h4>"
    if(data.extra != null)
    MainHtml += "<h4 style = 'margin-left : 2%'>" + data.extra + "</h4>"
    MainHtml += "</ul></div>"

    if(data.steps != null)
    {
        let log = data.steps

        for(let i = 0 ; i < log.length ; i++)
        {
        MainHtml += "<div style = 'margin : 2%'>"
        level2(log[i])
        MainHtml += "</div>"

        }
    }
}
function level2(data)
{
    MainHtml += "<div style = 'margin : 4%'> <ul class = 'b' >"
    MainHtml += "<h4><li>" + data.heading + "</li></h4>"
    MainHtml += "<h4 style = 'margin-left : 2%'><i>" + data.details + "</i></h4>"
    if(data.extra != null)
    MainHtml += "<h4 style = 'margin-left : 2%'>" + data.extra + "</h4>"
    MainHtml += "</ul></div>"
}