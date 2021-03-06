var PodcastModel = require('./models/podcastModel.js');
var NewPodcastModel = require('./models/newPodcastModel.js');
var UserModel = require('./models/userModel.js');
var PostModel = require('./models/postModel.js');
var CourseModel = require('./models/courseModel.js');
var mongoose = require('mongoose');
var fs = require('fs');
var srt2vtt = require('srt2vtt');
var base64 = require('node-base64-image');
var xss = require('xss');

//API Functions
var apiFunctions = {
  //API Functions for podcast schema
  podcastFunctions:{

    getRecommendations : function(request,callback){
      PodcastModel.findById(request.PodcastId,"Recommendations Time",function(err,info){
        if(err || info == null)
          return callback({Recommendations : [], Time : 0});
        return callback({Recommendations : info.Recommendations, Time : info.Time});
      });
    },
    getVideosForCourse: function(request, callback){
      CourseModel.findById( request.CourseId, function(err,course){
        if(course == null || err || course.Podcasts == null) {
          callback({});
          console.log("error finding course");
        } else {
          var copy = [];
          for(var i = 0; i < course.Podcasts.length; i++){
            var arrayObject = {
              Id : course.Podcasts[i].PodcastId,
              Time : course.Podcasts[i].Time,
              PreviewImage : course.Podcasts[i].PodcastImage
            };
            copy.push(arrayObject);
          }
          var response = {
            CourseTitle : course.Name + " " + course.Quarter,
            Videos : copy
          };
          callback(response)
        }
      });

    },

    /*
      request{
        PodcastId : podcastId
      }
    */
    getVideoInfo: function(request, callback) {

      PodcastModel.findById(request.PodcastId,
                            'SRTBlob PodcastUrl Time AudioTranscript NextVideo PrevVideo Slides',
                            function(err,podcast) {
        if(err || podcast == null) {
          callback({});
          return;
        } else {
          srt2vtt(podcast.SRTBlob, function(err, vttData) {
            if (err)
              console.log("ERROR" + err);
            var response = {
              VideoURL : podcast.PodcastUrl,
              VideoDate : podcast.Time,
              SRTFile : vttData.toString('utf8'),
              ParsedAudioTranscriptForSearch : podcast.AudioTranscript,
              Slides : podcast.Slides,
              NextVideo: podcast.NextVideo,
              PrevVideo: podcast.PrevVideo
            };
            callback(response);
          });
        }
      })
    },

    getKeywordSuggestions: function(request, callback) {
      CourseModel.findById(request.CourseId, 'Podcasts', function(err, course) {
        var keywordSuggestions = [];

        if (err || course == null) {
          callback([]);
          return;
        }

        for (var i = 0; i < course.Podcasts.length; i++) {
          var arr = course.Podcasts[i].OCRKeywords;
          for (var x = 0; x < arr.length; x++) keywordSuggestions.push(arr[x]);
        }

        var frequency = {};
        keywordSuggestions.forEach((value) => {frequency[value] = 0;});

        keywordSuggestions = keywordSuggestions.filter(
          (value) => {
            return value != undefined && value.length >= request.minKeywordLength && ++frequency[value] == 1;
          }
        );

        keywordSuggestions = keywordSuggestions.sort(
          (a, b) => {return frequency[b] - frequency[a];}
        );

        keywordSuggestions = keywordSuggestions.slice(0, request.count);
        callback(keywordSuggestions);
      });
    },

    searchByKeywords: function(request, callback){
      CourseModel.findById(request.CourseId,
                          'Podcasts',
                          function(err, course) {
        if(err || course == null){
          callback([]);
          return;
        }
        var results = [];
        var keywordsArr = request.Keywords.split(' ');

        for (let i = 0; i < course.Podcasts.length; i++) {
          for (let j = 0; j < keywordsArr.length; j++) {
            if (keywordsArr[j].length < 1) continue;
            if (course.Podcasts[i].OCRKeywords.indexOf(keywordsArr[j]) != -1) {
              delete course.Podcasts[i].OCRKeywords;
              results.push(course.Podcasts[i]);
              break;
            }
          }
          if (results.length >= request.count) break;
        }

        console.log(new Date());
        callback(results);
      });
    },

    deepSearchByKeywords: function(request, callback) {
      var start = (new Date()).getTime();
      if (request.Keywords == undefined)
        return callback([]);
      var keywords = request.Keywords.toLowerCase();
      var results = [];

      /* This block attempts to save time by filtering stuff in the db layer, but is 3x slower in tests
          NewPodcastModel.find({'CourseId' : request.CourseId,
              $or : [{Slides : {$elemMatch : {OCRTranscription : {$regex : request.Keywords, $options: 'i'}}}},
              {AudioTranscript : {$elemMatch : {Content : {$regex : request.Keywords, $options: 'i'}}}}]},
              '_id Slides AudioTranscript Time',
              function (err, podcasts) {
      */
      CourseModel.findById(request.CourseId, function (err, course) {
        var images = {};
        for (let a = 0; a < course.Podcasts.length; a++) {
          var working = course.Podcasts[a];
          images[working.PodcastId] = working.PodcastImage;
        }

        NewPodcastModel.find({CourseId: request.CourseId},
                          '_id Slides AudioTranscript Time',
                          function(err, podcasts) {
          for (let i = 0; i < podcasts.length; i++) {
            var podcast = podcasts[i];
            var matches = [];
            var times = [];

            for (let j = 0; j < podcast.Slides.length; j++) {
              if (matches.length == 7)
                break;

              var slide = podcast.Slides[j];
              times.push(slide.StartTime);

              if (slide.OCRTranscription.toLowerCase().indexOf(keywords) != -1) {
                matches.push({
                    'Type': 'OCR',
                    'Text': slide.OCRTranscription.replace(/\n/g, ''),
                    'SlideNo': slide.SlideNum
                });
              }
            }

            for (let k = 0; k < podcast.AudioTranscript.length; k++) {
              var transcript = podcast.AudioTranscript[k];
              if (matches.length == 20)
                break;
              if (transcript.Content.toLowerCase().indexOf(keywords) != -1) {
                var audioMs = transcript.StartTime * 1000;
                var z;
                for (z = 0; z < times.length; z++) {
                  if (audioMs < times[z]) break;
                }
                matches.push({
                  'Type': 'AUDIO',
                  'Text': transcript.Content.replace(/\n/g, ''),
                  'SlideNo': z
                });
              }
            }

            if (matches.length > 0)
              results.push({
                'PodcastId': podcast._id,
                'LectureTime': podcast.Time,
                'Matches': matches,
                'PodcastImage': images[podcast._id]
              });

            if (i == podcasts.length - 1 ) {
              console.log('elapsed: ' + (new Date().getTime() - start) + 'ms');
              return callback(results);
            }
          }
        });

      });
    }
  },

  //functions to retrieve and create user information
  userFunctions:{
    getImage : function(req, callback) {
      base64.encode(req.imageURL, {string: true}, function(error, image) {
        callback('data:image/jpeg;base64,' + image);
      });
    },

    getUsers : function(req, callback) {
      UserModel.find({}, 'Name FBUserId', function(err, users) {
        callback(users);
      });
    },
    //middleware do not remove
    isLoggedIn : function(req,res,next){
      if (req.session.user){
          return next();
          console.log(res);
      }
      else {
          console.log("HERE'S THE REDIRECT URL" + req.url);
          res.send(false);
      }

    },
    getUser : function(req,callback){
      UserModel.findById(req.UserId, 'Name ProfilePicture', function(err,user){
        if(err || user == null){
          callback({Name : "", Pic : ""});
          return;
        }
        var response = {
          Name : user.Name,
          Pic : user.ProfilePicture
        }

        callback(response);
        return;
      });
    },
    getNotesForUser : function(req,callback){
        //query commented out, don't remove
        UserModel.findOne({_id : req.UserId, "Notes.PodcastId" : req.PodcastId},'Notes',function(err,notes){
          if(notes == null || err || notes.Notes.length == 0)
            return callback({Notes : ""});

          for (var x = 0; x < notes.Notes.length; x++) {
            if (notes.Notes[x].PodcastId != req.PodcastId)
              continue;

            var response = {
              "Notes" : xss(notes.Notes[x].Content)
            };
            break;
          }
          callback(response);
      });
    },
    createNotes : function(request,callback){
      UserModel.findOne({_id : request.UserId, "Notes.PodcastId" : request.PodcastId}, function(err,user){
        if(err)
          return callback(false);

        if(user){
          UserModel.update({_id : request.UserId, "Notes.PodcastId" : request.PodcastId}, {"Notes.$.Content" : request.Content},function(err){
            return callback(true);
          });
        }
        else{
          UserModel.update({_id : request.UserId},{$push : {"Notes" : {"PodcastId" : request.PodcastId, "Content" : request.Content}}},function(err){
            return callback(true);
          });
        }
      });
    },
    addUser : function(name,profileId,callback){
      UserModel.create({Name:name, FBUserId: profileId, Notes :
      [],ProfilePicture : 'https://graph.facebook.com/'+ profileId +'/picture?type=square'}, function(err,users){
      if(err || users == null) {
        callback(err,users);
      }
      else{
        callback(null,users);
      }
      });
    },
  },
  courseFunctions :{
    getCourses : function(callback){
      CourseModel.find({}, "_id Name Quarter", function(err,courses){
        if(err || courses == null){
          return callback([]);
        }
        for(var i = 0; i < courses.length; i++){
          var object = {
            Id : courses[i]._id,
            Course : courses[i].Name,
            Quarter : courses[i].Quarter
          };
          courses[i] = object;
        }
        callback(courses);
      });

    },
    getCourseInfo : function(request,callback, neverBefore) {
      if (!request.CourseId) {
        res.send({});
        return;
      }
      CourseModel.findById(request.CourseId, '_id Name Quarter', function(err,course){
          if (err || course == null) {
            this.getPodcastInfo(request, callback, neverBefore);
            return;
          }
          var courseToRet = {
            Id : course._id,
            Course : course.Name,
            Quarter : course.Quarter
          };

        callback(courseToRet);
      }.bind(this));
    },
    getPodcastInfo: function (request, callback, neverBefore) {
      if (neverBefore) {
        callback({});
        return;
      }

      PodcastModel.findById(request.CourseId, '_id CourseId', function(err,course){
        if (err || course == null) {
          callback({});
          return;
        }
        request.CourseId = course['CourseId'];
        this.getCourseInfo(request, callback, true);
      }.bind(this));
    }
  },
  postFunctions:{
    getPostsForCourse : function(request, callback){
      PostModel.find({'CourseId': request.CourseId}).sort({TimeOfPost: -1}).exec(function(err,posts){
        if (err || posts == null) {
          callback([]);
          return;
        }
        if(posts.length >= request.UpperLimit){
            posts = posts.slice(0,request.UpperLimit);
        }
        var podcastids = [];
        for(var i = 0; i < posts.length; i++){
          podcastids.push(posts[i].PodcastId);
        }
        PodcastModel.find({"_id" : {$in : podcastids}},"Time",function(err,podcastInfo){
          for(var i = 0; i < posts.length; i++){
            var copy = JSON.parse(JSON.stringify(posts[i]));
            copy.PostId = copy._id;
            delete copy._id;
            delete copy.CourseId;
            posts[i] = copy;
          }
          for(var k = 0; k < podcastInfo.length; k++){
            for(var j = 0; j < posts.length; j++){
              if(posts[j].PodcastId == podcastInfo[k]._id){
                posts[j].LectureDate = podcastInfo[k].Time;
              }
            }
          }
          callback(posts);
        });
      });
    },
    getPostsForLecture : function(request, callback){
      PostModel.find({'PodcastId': request.PodcastId}).sort({TimeOfPost: -1}).exec(function(err,posts){
        if (err || posts == null) {
          callback([]);
          return;
        }
        var podcastids = [];
        for(var i = 0; i < posts.length; i++){
          podcastids.push(posts[i].PodcastId);
        }
        for(var i = 0; i < posts.length; i++){
          var copy = JSON.parse(JSON.stringify(posts[i]));
          copy.PostId = copy._id;
          delete copy._id;
          delete copy.CourseId;
          posts[i] = copy;
        }
        callback(posts);
      });
    },
    getPostsByKeyword : function(request,callback){
      PostModel.find({'CourseId' : request.CourseId,
        $or : [{Content: {$regex : request.Keywords, $options: 'i'}},
        {Comments : {$elemMatch : {Content : {$regex : request.Keywords, $options: 'i'}}}}]}).sort(
        {TimeOfPost: -1}).exec(function (err, posts) {
            if (err || posts == null) {
              callback([]);
              return;
            }
            var podcastids = [];
            for(var i = 0; i < posts.length; i++){
              podcastids.push(posts[i].PodcastId);
            }
            PodcastModel.find({"_id" : {$in : podcastids}},"Time",function(err,podcastInfo){
              for(var i = 0; i < posts.length; i++){
                var copy = JSON.parse(JSON.stringify(posts[i]));
                copy.PostId = copy._id;
                delete copy._id;
                delete copy.CourseId;
                posts[i] = copy;
              }
              for(var k = 0; k < podcastInfo.length; k++){
                for(var j = 0; j < posts.length; j++){
                  if(posts[j].PodcastId == podcastInfo[k]._id){
                    posts[j].LectureDate = podcastInfo[k].Time;
                  }
                }
              }
              callback(posts);
            });
      });
    },
    createPost: function(request,callback) {
      PodcastModel.findById(request.PodcastId,"CourseId", function(err,podcast){
        PostModel.create({PodcastId : request.PodcastId, SlideOfPost : request.SlideOfPost, TimeOfPost : request.TimeOfPost,
        Content : xss(request.Content), CourseId : podcast.CourseId, Name : request.Name, ProfilePic : request.ProfilePic},function(err,post){
          if(err || post == null)
            return callback(false);
          else {
            return callback(post._id);
          }
        });
      });
    },

    createComment: function(request,callback) {
      var commentObject = {
        Pic : request.Pic,
        PosterName : request.PosterName,
        Time  : request.Time,
        Content : xss(request.Content)
      };

      PostModel.findByIdAndUpdate(
        request.PostId,
        {$push: {'Comments': commentObject}},
        function(err, model) {
          if (err) return callback(false);
          else return callback(true);
        }
      );

    }
  }
}

module.exports = apiFunctions;
