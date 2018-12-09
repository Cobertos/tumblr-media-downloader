# tumblr-media-downloader

An npm script that will go through your blog posts or like posts using an API key and download:

* Videos from `video` posts
* Photos from `photo` posts
* `<video>`, `<img>` and `<video> > <source>` tags from any other post

### Usage

* Clone the repository
* `npm install`
* Replace the API key and Tumblr URL with your api key and blog URL
* `node dl.js [offset]` where offset is the first post to start at. Default is 0.