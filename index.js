var tesseract = require('node-tesseract');
var retext = require('retext');
var nlcstToString = require('nlcst-to-string');
var keywords = require('retext-keywords');
var worder = require("worder");
var checkWord = require('check-word')
var checker = checkWord('en');

// Recognize text of any language in any format
tesseract.process(__dirname + '/screenshot.png',function(err, text) {
    if(err) {
        console.error(err);
    } else {
        parse(text);
    }
});

var parse = function(text) {
    console.log("---------------------OCR Text Result--------------------------")
    console.log(text);

    console.log();
    console.log("---------------------Validated english words--------------------------")
    console.log();
    var words = worder(text);
    var validWords = new Array();
    //console.log(words);

    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        if (checker.check(word)) {
            validWords.push(word);
        }
    }
    console.log(validWords);

    console.log();
    console.log("---------------------Retext-Keywords--------------------------")
    console.log();
    retext().use(keywords).process(
      text,
      function (err, file) {
        console.log('Keywords:');
     
        file.data.keywords.forEach(function (keyword) {
          console.log(nlcstToString(keyword.matches[0].node));
        });
     
        console.log();
        console.log('Key-phrases:');
     
        file.data.keyphrases.forEach(function (phrase) {
          console.log(phrase.matches[0].nodes.map(nlcstToString).join(''));
        });
      }
    );
} 

var ffmpeg = require('ffmpeg');


try {
  var process = new ffmpeg('cse100.mp4');
  process.then(function (video) {
    // Callback mode
    video.fnExtractFrameToJPG('/path/to/save_your_frames', {
      frame_rate : 1,
      number : 5,
      file_name : 'my_frame_%t_%s'
    }, function (error, files) {
      if (!error)
        console.log('Frames: ' + files);
    });
  }, function (err) {
    console.log('Error: ' + err);
  });
} catch (e) {
  console.log(e.code);
  console.log(e.msg);
}