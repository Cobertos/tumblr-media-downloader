const requireES6 = require("esm")(module);
const fs = require("fs");
const path = require("path");
const Stream = require('stream').Transform;
const { http, https } = require('follow-redirects'); //Needed to follow 302's for files
const { getMediaURLs } = requireES6("./src/api.js");

const tumblrURL = "staff.tumblr.com";
const apiKey = "KCndgrBCIxZM831OyEd7yIoL0uKZBJCqvCwSMYVGBcKDlPIMGn";
const startOffset = Number.parseInt(process.argv[2]) || 0;
const endPoint = process.argv[3] || "posts";
const savePath = "./";

async function saveURLToDisk(url, prefix) {
    return new Promise((resolve, reject)=>{
        try {
            let imgName = path.basename(url);
            let imgPath = path.resolve(savePath, prefix + "_" + imgName);
            console.log(`Saving ${imgPath} to disk`);
            let imgStream = fs.createWriteStream(imgPath);

            //Download into file stream
            let isHttps = !!url.match(/^https/);
            (isHttps ? https : http).get(url, (response)=>{
                //Check the contentLength
                //Deleted images .jpg and .gif will return 0, while .mp4s seem to
                //return AccessDenied
                console.log(response.headers["content-length"]);
                response.pipe(imgStream);
                response.on("end", resolve);
            }).end();
        }
        catch(e){
            console.error(e);
            reject(e);
        }
    });
}

async function doIt() {
    let urlIndex = startOffset;
    for await (let url of getMediaURLs(tumblrURL, apiKey, endPoint, startOffset)) {
        await saveURLToDisk(url, urlIndex);
        urlIndex += 1;
    }
}
doIt();