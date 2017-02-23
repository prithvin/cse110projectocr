var PodcastModel = require('./models/podcastModel.js');
var UserModel = require('./models/userModel.js');
var PostModel = require('./models/postModel.js');
var CourseModel = require('./models/courseModel.js');
var mongoose = require('mongoose');
var fs = require('fs');
var srt2vtt = require('srt2vtt');

//API Functions
var apiFunctions = {
        //API Functions for podcast schema
        podcastFunctions:{
          //dummy function
          createPodcasts: function(){/*
            PodcastModel.create({ClassName: "CSE100", QuarterOfCourse: "Winter", ClassNameCourseKey:"CSE100" + "Winter", PodcastUrl:'https://podcast.ucsd.edu/podcasts/default.aspx?PodcastId=3743&l=6&v=1',
            OCRTranscriptionFreq: [{word:'BST', freq: 2}, {word: "Iterator", freq: 3}]}, function(err, podcasts){
            if(err) console.log(err);
              else console.log(podcasts);
            });*/
          },
          //get all posts for course sorted
          /*
          var response{
            ClassNameCourseKey : value
          }

        }*/
          /*
          request{
            CourseId
          }
          */
          getVideosForCourse: function(request, callback){
            CourseModel.findOne({_id: request.CourseId}, function(err,course){
              if(err) {
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
              CourseId :
              UpperLimit :
            }
          */
          findPodcastsByKeyword: function(request,callback){
            PodcastModel.find({ClassNameCourseKey:courseKey, OCRTranscriptionFreq:{$elemMatch : {word: {$in : keywordParams.split(" ")}}}}, function (err, podcasts) {
              var arrayOfPodcasts = [];
              for(var i = 0; i < podcasts.length; i++){
                var podcastObject = {
                  //Todo
                }
                arrayOfPodcasts.push(podcastObject);
              }
              callback({
                Podcasts : arrayOfPodcasts
              });
            });
          },

          /*
            request{
              PodcastId : podcastId
            }
          */
          getVideoInfo: function(request, callback) {
            PodcastModel.findOne({"_id" : request.PodcastId}, function(err,podcast) {
              if(err) {
                console.log("error");
              } else {
                srt2vtt(podcast.SRTBlob, function(err, vttData) {
                  if (err)
                    console.log("ERROR" + err);
                  var response = {
                    VideoURL : podcast.PodcastUrl,
                    VideoDate : podcast.Time,
                    SRTFile : vttData.toString('utf8'),
                    ParsedAudioTranscriptForSearch : podcast.AudioTranscript,
                    Slides : podcast.Slides
                  };
                  callback(response);
                });
              }
            })
          },
        },

        //functions to retrieve and create user information
        userFunctions:{
          //middleware do not remove
          isLoggedIn : function(req,res,next){
            if (req.isAuthenticated()){
                return next();
                console.log(res);
            }
            else {
                console.log("HERE'S THE REDIRECT URL" + req.url);
                res.redirect('/login?callbackURL=' + req.url);
            }

          },
          getUser : function(req,callback){
            UserModel.findOne({"_id":req.UserId},function(err,user){
              var response = {
                Name : user.Name,
                Pic : user.ProfilePicture
              }

              callback(response);
            });
          },
          getNotesForUser : function(req,callback){
              console.log("The user is inside is" + req.UserId);
              //query commented out, don't remove
              UserModel.find({_id : req.UserId, "Notes.PodcastId" : req.PodcastId},{"Notes.Content" : 1},function(err,notes){
              if(notes.length == 0)
                return callback({Content : ""});
              var response = {
                Content : notes[0].Notes[0].Content
              };
              callback(reponse);
            });
          },
          addUser : function(name,profileId,callback){
            UserModel.create({Name:name, FBUserId: profileId, ProfilePicture : 'http://graph.facebook.com/'+ profileId +'/picture?type=square'}, function(err,users){
            if(err) {
            console.log(err);
            }
            else{
                console.log("HERE ARE THE USERS" + users);
                callback(err,users);
            }
            });
          },
          //adds courses for the user
          addCoursesForUser : function(request,callback){
            var FBAuthID = request.FBAuthID;
            var ClassNameCourseKey = request.ClassNameCourseKey;

          },
        },
        courseFunctions :{
          getCourses : function(callback){
            CourseModel.find({},function(err,courses){
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
          getCourseInfo : function(request,callback){
            CourseModel.findOne({CourseId : request.courseId},function(err,course){
                var courseToRet = {
                  Id : course._id,
                  Course : course.Name,
                  Quarter : course.Quarter
                };

              callback(courseToRet);
            });
          }
        },
        postFunctions:{
          getPostsForCourse : function(request, callback){
            PostModel.find({'CourseId': request.CourseId}, {TimeOfPost: -1}, function(err,posts){
              var response;
              if(posts.length >= request.UpperLimit){
                  posts = posts.slice(0,request.UpperLimit);
              }

              for(var i = 0; i < posts.length; i++){
                var copy = JSON.parse(JSON.stringify(posts[i]));
                copy.PostId = copy._id;
                delete copy._id;
                delete copy.PodcastId;
                delete copy.CourseId;
                posts[i] = copy;
                console.log(posts[i]);
              }
              callback(posts);
            });
          },
          getPostsForLecture : function(request, callback){
            PostModel.find({'PodcastId': request.PodcastId} , {TimeOfPost: -1}, function(err,posts){
              for(var i = 0; i < posts.length; i++){
                var copy = JSON.parse(JSON.stringify(posts[i]));
                copy.PostId = copy._id;
                delete copy._id;
                delete copy.PodcastId;
                delete copy.CourseId;
                posts[i] = copy;
                console.log(posts[i]);
              }
              callback(posts);
            });
          },
          getPostsByKeyword : function(request,callback){
            PostModel.find({'CourseId' : request.CourseId,
              $or : [{Content: {$regex : request.Keywords, $options: 'i'}},
              {Comments : {$elemMatch : {Content : {$regex : request.Keywords, $options: 'i'}}}}]},
              {TimeOfPost: -1}, function (err, posts) {
                if (!posts) {
                  callback([]);
                  return;
                }
                for(var i = 0; i < posts.length; i++){
                  var copy = JSON.parse(JSON.stringify(posts[i]));
                  copy.PostId = copy._id;
                  delete copy._id;
                  delete copy.PodcastId;
                  delete copy.CourseId;
                  posts[i] = copy;
                  console.log(posts[i]);
                }
                callback(posts);
            });
          },
          createPost: function(request,callback) {

              // @response should be true or false on successful/unsuccessful comment
          },

          createComment: function(request,callback) {

            // @response should be true or false on successful/unsuccessful post
          }
        }
}

module.exports = apiFunctions;
