# tumblr-media-downloader

An npm script that will go through your blog posts or like posts using an API key and download:

* Videos from `video` posts
* Photos from `photo` posts
* `<video>`, `<img>` and `<video> > <source>` tags from any other post

### Usage

* Clone the repository
* `npm install`
* [Generate an API key here](https://www.tumblr.com/oauth/apps) by filling out this form and getting your key.
* `node dl.js [offset] [saveFolder]` where `[offset]` is the first post to start at and `[saveFolder]` is the folder to save in. Default is 0.