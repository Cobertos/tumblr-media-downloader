const Vue = window.Vue;
const { getMediaURLs } = require("./api.js");

Vue.component("media-downloader-form", {
    template:`
<div>
    <div><input type="text" v-model="tumblrURL" placeholder="your-blog.tumblr.com"><label>Blog URL</label></div>
    <div><input type="text" v-model="apiKey" placeholder="Api Key"><label>API Key</label></div>
    <div><input type="text" v-model.number="offset" placeholder="Offset"><label>Start Post Number</label></div>
    <div><input type="radio" name="group" value="posts" v-model="endpoint"><label>Blog Posts</label></div>
    <div><input type="radio" name="group" value="likes" v-model="endpoint"><label>Likes</label></div>
    <div><input type="checkbox" v-model="autodl"><label>Automatic Download</label></div>
    <p v-if="autodl && !isChrome" style="color:#F00">Auto download seems to only work in Chrome!</p>
    <p v-if="autodl">REALLY SLOW! Might fail on files > 50MB.</p>
    <button @click="emit">Download</button>
</div>
    `,
    data(){
        return {
            tumblrURL: "staff.tumblr.com",
            apiKey: "KCndgrBCIxZM831OyEd7yIoL0uKZBJCqvCwSMYVGBcKDlPIMGn",
            offset: 0,
            endpoint: "posts",
            autodl: false,
            isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        };
    },
    methods: {
        emit(){
            //Emit the generator to generate URLs from
            let gen = getMediaURLs(this.tumblrURL, this.apiKey, this.endpoint, this.offset);
            let evt = document.createEvent('Event');
            evt.initEvent('download-media', true, true);
            evt.gen = gen;
            evt.offset = this.offset;
            evt.autodl = this.autodl;
            window.dispatchEvent(evt);
        }
    }
});

Vue.component("media-downloader-results", {
    template:`
<ul class="links">
    <li v-for="result in results">
        <a :href="result.url" target="_blank" :download="result.filename">{{result.url}}</a>
    </li>
</ul>
    `,
    data(){
        return {
            results : []
        };
    },
    mounted() {
        window.addEventListener('download-media', async (e)=>{
            const { gen, offset, autodl } = e;
            let index = 0 + offset;
            for await ( let url of gen ) {
                let imgName = url.split('/').pop().split('#')[0].split('?')[0];
                let filename = index + "_" + imgName;
                let id = `_${index}`;

                if(autodl) {
                    let response = await fetch(url, {
                        headers: new Headers({
                            'Origin': location.origin
                        }),
                        mode: 'cors'
                    });
                    let blob = await response.blob();
                    let blobURL = window.URL.createObjectURL(blob);
                    let a = document.createElement("a");
                    a.href = blobURL;
                    a.download = filename;
                    a.click();

                    await new Promise((resolve)=>{
                        //Wait a little bit
                        setTimeout(resolve, 1000);
                    });
                }
                this.results.push({
                    url, filename, id
                });
                index++;
            }
        }, false);
    }
});

window.addEventListener("DOMContentLoaded", ()=>{
    new Vue({
        el: "#app",
    });
});