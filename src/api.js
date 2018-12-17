const axios = require("axios");
const { DOMParser } = new (require("jsdom").JSDOM)().window;
    /*(typeof window === "undefined" ? 
    new (__non_webpack_require__("jsdom").JSDOM)().window :
    window);*/

export async function* getPageOfPosts(tumblrURL, apiKey, endpoint="posts", offset=0, limit=20) {
    const url = `https://api.tumblr.com/v2/blog/${tumblrURL}/${endpoint}?api_key=${apiKey}&offset=${offset}&limit=${limit}`;
    console.log(`=== Getting ${limit} ${endpoint} posts at offset ${offset} ===`);
    const resp = await axios.get(url);
    const posts = resp.data.response.posts;
    yield* posts;
}

//Gets all image and video urls from post
export function* getMediaURLsFromPost(post) {
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

export async function* getMediaURLs(tumblrURL, apiKey, endpoint, startOffset=0, limit=20) {
    let currOffset = startOffset;

    while(true) {
        try {
            for await (let post of getPageOfPosts(tumblrURL, apiKey, endpoint, currOffset, limit)) {
                for(let url of getMediaURLsFromPost(post)) {
                    yield url;
                }
            }
            currOffset += limit;
        }
        catch(e) {
            console.warn(`HTTP request error, maybe we're done, or limited?`, e);
            break;
        }
    }
}