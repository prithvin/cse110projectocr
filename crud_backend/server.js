var express = require('express');
var ObjectId = require('mongodb').ObjectId;
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
var apiFunctions = require('./api.js');
var routes = require('./routes.js');
var passport = require('passport');
var cors = require('express-cors')
var session = require('express-session');
var auth = require('./config/auth.js');
var UserModel = require("./models/userModel.js");
var path = require('path');
var fs = require('fs');
var bm = require('./BoyerMoore.js')

app.use(session({
    secret: 'cse110secretstring',
    resave: true,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
var myPassport = require('./config/passport.js');

var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };

//mongoose.connect('mongodb://testUser:testUser@ds139899.mlab.com:39899/testdbnaruto', options, function(error){
mongoose.connect('mongodb://localhost:27017/testdbnaruto', options, function(error) {
  if(error){
    console.log("Error Connecting" + error);
  }
  else{
    console.log("Connection Successful");
    // apiFunctions.podcastFunctions.createPodcasts();
  }
});

app.use(cors({
    allowedOrigins: [
        'localhost:7888',
        'localhost:8000',
        '104.131.147.159',
        '104.131.147.159:80',
        'www.podcastucsd.ml',
        'podcastucsd.ml'
    ]
}))


app.listen(3000, function() {
  console.log('listening on 3000')
})

/******************************************************************ROUTES*******************************************************************/

app.get('/', apiFunctions.userFunctions.isLoggedIn,function(req,res){
  res.send("MAIN PAGE ROUTE");
});

app.get('/login', function(req,res){
  if(req.session.user){
    res.redirect("/");
  }
  else {
    res.send("error");
  }
});


app.get('/getPostsForLecture',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    PodcastId : req.query.PodcastId
  };
  /*use response.posts to get an array of post objects*/
  apiFunctions.postFunctions.getPostsForLecture(request, function(response){
    res.send(response);
  });
});

app.get('/getPostsForCourse',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    CourseId : req.query.CourseId,
    UpperLimit : 20
  };
  /*use response.posts to get an array of post objects*/
  apiFunctions.postFunctions.getPostsForCourse(request, function(response){
    res.send(response);
  });
});

//request format should pass in a course id and an array of keywords
app.get('/getPostsByKeyword',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    CourseId : req.query.CourseId,
    Keywords : req.query.Keywords
  };
  apiFunctions.postFunctions.getPostsByKeyword(request,function(posts){
    res.send(posts);
  });
});

app.get('/getBase64Image',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    imageURL : req.query.imageURL
  }

  apiFunctions.userFunctions.getImage(request,function(image){
    res.send(image);
  });

});

app.get('/getAllUsers',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    UserId : req.session.user
  }

  apiFunctions.userFunctions.getUsers(request,function(users){
    res.send(users);
  });

});

/*returns entire user object*/

app.get('/getUser',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    UserId : req.session.user
  }

  apiFunctions.userFunctions.getUser(request,function(user){
    res.send(user);
  });

});

app.get('/getNotesForUser',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    UserId : req.session.user,
    PodcastId : req.query.PodcastId
  };
  apiFunctions.userFunctions.getNotesForUser(request,function(notes){
    res.send(notes);
  });
});

app.get('/getRecommendations', apiFunctions.userFunctions.isLoggedIn, function(req,res){
  var request = {
    PodcastId : req.query.PodcastId
  };
  apiFunctions.podcastFunctions.getRecommendations(request,function(recommendations){
    res.send(recommendations);
  });
});
app.get('/getVideoInfo',function(req,res){
  var request = {
    PodcastId : req.query.PodcastId
  };

  apiFunctions.podcastFunctions.getVideoInfo(request,function(podcast){
    res.send(podcast);
  });
});

app.get('/getVideosForCourse',apiFunctions.userFunctions.isLoggedIn,function(req,res){

  var request = {
    CourseId : req.query.CourseId
  };

  apiFunctions.podcastFunctions.getVideosForCourse(request,function(courseVideos){
    res.send(courseVideos);
  });

});

app.get('/getKeywordSuggestions', apiFunctions.userFunctions.isLoggedIn, function(req, res) {
  var request = {
    count: req.query.count,
    minKeywordLength: req.query.minKeywordLength,
    CourseId: req.query.CourseId
  };

  apiFunctions.podcastFunctions.getKeywordSuggestions(request, function(response) {
    res.send(response);
  });
});

app.get('/searchByKeywords', apiFunctions.userFunctions.isLoggedIn, function(req, res) {
  var request = {
    count: req.query.count,
    CourseId: req.query.CourseId,
    Keywords: req.query.Keywords
  };

  apiFunctions.podcastFunctions.searchByKeywords(request, function(response) {
    res.send(response);
  });
});

app.get('/deepSearchByKeywordsOpenRoutePrivate' , function(req, res) {
  var request = {
    CourseId: req.query.CourseId,
    Keywords: req.query.Keywords
  };

  apiFunctions.podcastFunctions.deepSearchByKeywords(request, function(response) {
    res.send(response);
  });
});

app.get('/deepSearchByKeywords', apiFunctions.userFunctions.isLoggedIn, function(req, res) {
  var request = {
    CourseId: req.query.CourseId,
    Keywords: req.query.Keywords
  };

  apiFunctions.podcastFunctions.deepSearchByKeywords(request, function(response) {
    res.send(response);
  });
});

app.get('/getCourses',apiFunctions.userFunctions.isLoggedIn, function(req,res){
  apiFunctions.courseFunctions.getCourses(function(courses){
    res.send(courses);
  });
});

app.get('/getCourseInfo',apiFunctions.userFunctions.isLoggedIn, function(req,res){
  var request = {
    CourseId : req.query.CourseId   // This might be a course Id, this might be a podcast id.
  };
  apiFunctions.courseFunctions.getCourseInfo(request,function(course){
    res.send(course);
  });
});

app.post('/createPost',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    PodcastId : req.body.PodcastId,
    SlideOfPost : req.body.SlideOfPost,
    TimeOfPost : req.body.TimeOfPost,
    Content : req.body.Content,
    CourseId : req.body.CourseId,
    ProfilePic : req.session.pic,
    Name : req.session.name
  };

  apiFunctions.postFunctions.createPost(request,function(postId){
    res.send(postId);
  });
});

app.post('/createNotes',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    UserId : req.session.user,
    PodcastId : req.body.PodcastId,
    Content : req.body.Content
  };
  apiFunctions.userFunctions.createNotes(request,function(status){
    res.send(status);
  });
});

app.post('/createComment',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  var request = {
    PostId : req.body.PostId,
    Time : req.body.Time,
    Content : req.body.Content,
    Pic : req.session.pic,
    PosterName : req.session.name
  };

  apiFunctions.postFunctions.createComment(request, function(status){
    res.send(status);
  });
});

app.get('/markWatchedLater',apiFunctions.userFunctions.isLoggedIn,function(req,res){
  res.send("watch later marked");
});


app.post('/login',function(req,res){
  res.redirect("/auth/facebook?callbackURL=" + req.query.callbackURL + "&errorCallbackURL=/login");
});

app.get('/isUserLoggedIn', function(req,res){
  if (req.session.user != null)
    res.send(true);
  else
    res.send(false);
});

app.get('/getUserSession', function(req,res) {
  res.send(200, {'user': req.session.user});
});

app.get('/setUserFromSession', function(req,res) {
  req.user = req.session.user;
});

app.get('/logout',function(req,res){
  req.session.destroy(function(err) {
    res.send("LOGGED OUT");
  });
});

app.get('/loginorcreate', function (req, res) {
  var profileID = req.query.id;
  var userName = req.query.name;
  UserModel.findOne({ FBUserId : profileID}, "_id Name ProfilePicture", function(err, user) {
    if (err){
      res.send(false);
      return;
    }
    if (user) {
      console.log("USER FOUND: " + user.Name + " @ " + new Date());
      req.session.user = user._id;
      req.session.profId = profileID;
      req.session.name = userName;
      req.session.pic = user.ProfilePicture;
      req.session.save(function () {
        res.send(true);
      });
    }
    else{
      apiFunctions.userFunctions.addUser(userName, profileID, function(err,newUser){
        if (err) {
          res.send(false);
          return;
        }
        req.session.user = newUser._id;
        req.session.profId = profileID;
        req.session.name = userName;
        req.session.pic = newUser.ProfilePicture;
        req.session.save(function () {
          res.send(true);
        });
      });
    }
  });

});






var realCallbackUrl = 'http://www.google.com';

/***************************************FACEBOOK AUTH****************************************************/
app.get('/auth/facebook', function(req,res,next){
  if (req.query.callbackURL == null || req.query.errorCallbackURL == null)  {
    res.send("Error. Invalid params");
    return;
  }
  req.session.callbackURL = req.query.callbackURL;
 console.log('auth.callbackURL is ' + auth.facebookAuth.callbackURL);
  //req.protocol + '://' +
  realCallbackUrl = ("https://www.podcastucsd.ml/api/auth/facebook/callback") //+ auth.facebookAuth.callbackURL;
  console.log("auth stage\n\n");
  req.session.save(function (err) {
    auth.callbackURL = req.query.callbackURL;
    auth.errorCallback = req.query.errorCallbackURL;
    //next();
    putStuff(req, res, next);
    //res.redirect('/auth/facebook/newcallback');
  });
});

function putStuff (req, res, next) {
  var object = {
      callbackURL: realCallbackUrl,
      display: 'popup',
      scope: [ 'email', 'basic_info'],
      profileFields: ['id', 'displayName', 'photos', 'email', 'birthday']
  };
  passport.authenticate('facebook', object)(req, res, next);
 }


app.get("/auth/facebook/callback",
  passport.authenticate('facebook', {
    failureRedirect : auth.errorCallbackURL,
  }),
  /*ON SUCCESS*/
  function(req,res){
    if(!req.session.user || req.session.user.FBUserId != req.user.FBUserId) {
      req.session.user = req.user;
      req.session.save((err) => {
        if(err)
          console.log(err);
      });
    }
    console.log('req.session.callbackURL is ' + req.session.callbackURL);
    res.redirect(req.session.callbackURL);
  },
  /*NEED TO BYPASS AUTHORIZATION TOKEN HAS BEEN USED ISSUE*/
  function(err,req,res,next) {
        if(err) {
          console.log("Bypassing auth");
          ////console.log(req);
         // res.redirect('/api/auth/facebook?callbackURL=' +
          //encodeURIComponent(auth.callbackURL) + "&errorCallbackURL=" +
          ////auth.errorCallback);
        }
  });
