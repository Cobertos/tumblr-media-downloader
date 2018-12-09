const fs = require("fs");
const path = require("path");
const Stream = require('stream').Transform;
const { http, https } = require('follow-redirects'); //Needed to follow 302's for files
const { DOMParser } = new (require("jsdom").JSDOM)().window;
const axios = require("axios");

//Download images and videos from type: "video", type: "photo",
//and <img> and <video> tags from all other types

const tumblrURL = "hardhotletsfrot.tumblr.com";
const apiKey = "KCndgrBCIxZM831OyEd7yIoL0uKZBJCqvCwSMYVGBcKDlPIMGn";
const startOffset = Number.parseInt(process.argv[2]) || 0;

async function* getPageOfPosts(tumblrURL, apiKey, endpoint="posts", offset=0, limit=20) {
    const url = `https://api.tumblr.com/v2/blog/${tumblrURL}/${endpoint}?api_key=${apiKey}&offset=${offset}&limit=${limit}`;
    console.log(`=== Getting ${limit} ${endpoint} posts at offset ${offset} ===`);
    const resp = await axios.get(url);
    const posts = resp.data.response.posts;
    yield* posts;
}

//Gets all image and video urls from post
function* getMediaURLsFromPost(post) {
    let dl = [];
    let url = post.post_url;
    if(post.type === "video") {
        if(!post.video_url) {
            console.warn(`Video did not have video_url ${url}`);
            yield* [];
        }
        dl.push(post.video_url);
    }
    else if(post.type === "photo"){
        if(!post.photos) {
            console.warn(`Photo post had no photos ${url}`);
            yield* [];
        }
        post.photos.forEach((p)=>dl.push(p.original_size.url));
    }
    else {
        if(!post.body) {
            console.warn(`Unhandled post type ${post.type} has no .body to parse ${url}`);
            yield* [];
        }
        let doc = new DOMParser().parseFromString(post.body, "text/html");
        doc.querySelectorAll("img, video, video > source")
            .forEach((el)=>{
                let src = el.getAttribute("src");
                if(!src) {
                    return;
                }
                dl.push(src);
            });
        if(dl.length === 0) {
            console.warn(`Could not find any img, video, or video > source tags for this post ${url}`)
        }
    }
    console.log("Found urls: ", dl);
    yield* dl;
}

async function saveURLToDisk(url, prefix) {
    return new Promise((resolve, reject)=>{
        try {
            let imgName = path.basename(url);
            let imgPath = path.resolve("./", prefix + "_" + imgName);
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
    let currOffset = startOffset;
    let urlIndex = currOffset;
    const limit = 20;

    while(true) {
        try {
            for await (let post of getPageOfPosts(tumblrURL, apiKey, "posts" currOffset, limit)) {
                for(let url of getMediaURLsFromPost(post)) {
                    urlIndex += 1;
                    await saveURLToDisk(url, urlIndex);
                }
            }
            currOffset += limit;
        }
        catch(e) {
            console.warn(`HTTP request error, maybe we're done?`, e);
            break;
        }
    }
}
doIt();