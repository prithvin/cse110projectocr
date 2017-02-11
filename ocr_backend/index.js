var exec = require("child_process").exec;
var scraper = require("./scrapePodcasts.js");
var videoParsing = require("./videoParsing.js");
var fs = require('fs');
var uploader = require('./dbuploader.js');
var keywordExtract = require("./keywordExtract.js");
var existing = new Set([]);
var counter = 0;

uploader.getPodcastList(function(podcasts) {
  podcasts.forEach(function(e) {
    existing.add(e.PodcastUrl);
    counter++;
  });

  if (counter == podcasts.length) {
    scraper.scrapePodcasts(existing, function(working) {
      console.log("finished scraping");

      exec("rm -rf tmp* && rm -f *.mp4", function(error, stdout, stderr) {
        working = [
          'http://podcast.ucsd.edu/Podcasts//fa16/poli27fa16/poli27fa16-11022016-1200.mp4',
          'http://podcast.ucsd.edu/Podcasts//cse101_1_wi17/cse101_1_wi17-02032017-0900.mp4'
        ];
        videoParsing.parseVideo(working, 0);
      });
    });
  }
});
