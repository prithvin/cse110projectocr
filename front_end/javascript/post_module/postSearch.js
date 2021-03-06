/*
    new PostSearch(
        {"UniqueID": "1", "TypeOfFetch": "PodcastSearch"},
        {"Name": "Prithvi Narasimhan", "Pic": "http://pages.stern.nyu.edu/~sbp345/websys/phonegap-facebook-plugin-master/src/android/facebook/FacebookLib/res/drawable/com_facebook_profile_picture_blank_square.png"},
        $(".search-module")
    )*/
var PostSearch = class PostSearch {

    /*
        Parameters:
            postFetchData (JSON Object, make sure all keys and values are valid)
                {
                    UniqueID: // unqiue id to query database with
                    TypeOfFetch: "CourseGlobal" (course home page --> unqiue id is courseid)
                                 "PodcastSearch" (podcast page --> unique id is podcastid)
                                 "CourseSearch" (course search --> unique id is course id)
                    SearchQuery: String // only required for CourseSearch
                }

            userData (JSON Object, make sure all keys and values are valid)
                {
                    Name: String,
                    Pic: String
                } // DB will be uploaded by user session token

            mainDiv (jquery object containing element where all elements on this page interact with)
    
            ocrAudioData --> again optional parameter
                -Only open for Prithvi/ Allen to use, no docs needed
            {
                "ParsedAudioTranscriptForSearch":
                "Slides":
            }


            <TODO> must implement still last paramtere stuff
            videoData (optional parameter if the video has already started playing)
                IF NOT USING, PLEASE PASS AS NULL, DONT PASS EMPTY JSON OBJECT PLZ
                {
                    CurrentSlideNum:
                    VideoURL: 
                }
    
             callback forwhen post page is loaded (only for post page)

    */
    constructor (postFetchData, userData, mainDiv, ocrAudioData, videoData, podcastid, callback) {
        this.currWord = 0;
        this.postFetchData = postFetchData;
        this.userData = userData;
        this.mainDiv = $(mainDiv).find(".search-module");
        this.doneLoading = callback;
        this.podcastid = podcastid; // ONLY NEEDED FOR POST PAGE
        //this.videoCurrentSlide = 1;

        this.slideTransitionDiv = $(this.mainDiv).parent().find(".rectangle").hide();
        $(this.slideTransitionDiv).hide();

        // Default to current slide as one
        this.posts = [];

        this.currentViewData = {
            "PageType": "Lecture" // could also be Notes, Lecture, Unanswered
            //"SlideNo": 1    // only if SlideNo called, tohewrise slide defaults to video slide
        };

        if (videoData != null && videoData['CurrentSlideNum'] != null)  {
            this.videoCurrentSlide = videoData['CurrentSlideNum'];
            this.videoURL = videoData['VideoURL'];
            this.currentViewData['SlideNo'] = this.videoCurrentSlide;
        }
        
        this.setUpSlideTransitionModule();

        // DOM Elements
        this.searchModule = $(this.mainDiv).parent().find(".search-module");
        this.noResultsOption = $(this.mainDiv).find(".no-results");
        this.searchInputForm = $(this.mainDiv).prev();
        this.searchInputField = $(this.searchInputForm).find("#secondary-search-bar");
        this.viewAllPostsButton =  $(this.mainDiv).find(".all-posts-view");
        this.newPostButton = $(this.mainDiv).prev().find(".new-post-img");
        this.otherNewPostButton = $(this.mainDiv).find(".new-post-img-other");
        this.loadingModule = $(this.mainDiv).parent().find("#slide-transition-data");
        this.notesWrapper = $(this.mainDiv).find(".notes-module");
        this.loadingModule.hide();
        // Package loads
        this.mark = new Mark($(this.searchModule)[0]);

        

        // DOM Interactions in constructor
        $(this.noResultsOption).hide();

        this.isPodcastPage = false;
        if (ocrAudioData) {
            this.slideTimes = ocrAudioData["Slides"];
            this.isPodcastPage = true;
            this.ocrModule = new OCRAudioPosts(ocrAudioData, this.mainDiv, function () {
                this.OCRAudioLoaded = true;
            }.bind(this));
            this.numberOfSlides = ocrAudioData["Slides"].length;

            loadHTMLComponent("NotesModule", function (data) {
                var notesDiv = $(this.mainDiv).find(".notes-module").html(data);
                this.notesModule = $(notesDiv).find(".notes-wrapper");
                this.notes = new Notes($(this.notesModule), ocrAudioData["Notes"], this.podcastid);
                this.showNotes();
            }.bind(this));
        
        }
        /*
        else{
           $(this.mainDiv).on("click", ".post-container", function (ev) {
                var target = ev.currentTarget;
                var slideDiv = $(target).find(".slide-no");
                var pid = $(slideDiv).attr("data-podcast");
                var slide = $(slideDiv).attr("data-slide");
                
               window.location.hash = '#/podcast/' + pid + '/' + slide;
            });
        }*/


        this.detectTypeOfPostsToShow(); // this.shouldAllowNewComments is set here
        this.loadPostsFromServer(this);
        this.noPostsNewPostHandling(this);
        this.startFormListeners(this);

        // dropdown related stuff
        this.generateDropdownMenu();
        this.handleAllLectureTrigger();
        this.handleUnresolvedLectureTrigger();
        
    }

    getCurrentSlideOfNewPost () {
        if (this.currentViewData["PageType"] != "Slide") {
            return this.videoCurrentSlide;
        }
        else {
            return this.currentViewData['SlideNo'];
        }
    }
    noPostsNewPostHandling (thisClass) {

        $(this.viewAllPostsButton).on("click", function (ev) {
            ev.preventDefault();
            thisClass.showAllPostsOfLecture();
        });

        $(this.newPostButton).on("click", function (ev) {
            var newPostVal = $(this.searchInputField).val();
            if (newPostVal.trim().length == 0)
                swal("Have a question or comment? Write it in the search bar and post it with the post button!");   // Alert library
            else {
                this.generateNewPost(newPostVal, new Date().getTime(), this.getCurrentSlideOfNewPost()); 
            }
        }.bind(this));
        $(this.otherNewPostButton).on("click", function (ev) {
            var newPostVal = $(this.searchInputField).val();
            if (newPostVal.trim().length == 0)
                swal("Have a question or comment? Write it in the search bar and post it with the post button!");   // Alert library
            else {
                this.generateNewPost(newPostVal, new Date().getTime(), this.getCurrentSlideOfNewPost()); 
            }
        }.bind(this));
    
    }

    changeSlideCompletely (slideNo) {
        if (slideNo != this.videoCurrentSlide) {
            this.showNotifcationToUserForSlideTransition(this.videoCurrentSlide);
        }
        else {
            this.slideTransitionDiv.hide();
        }
        this.currentViewData = {
            "PageType": "Slide",
            "SlideNo": slideNo
        };
        this.dropdownMenu.switchToSlide(slideNo);
        this.cleanUpSearch();
        this.searchForSlide(slideNo);

    }

    handleAllLectureTrigger () {
        $(this.mainDiv).parent().find(".dropdownOfSlide").on("AllLecture", function () {
            this.showAllPostsOfLecture();
        }.bind(this));
    }

    handleUnresolvedLectureTrigger () {
        $(this.mainDiv).parent().find(".dropdownOfSlide").on("UnresolvedLecture", function () {
            this.showAllPostsUnresolved();
        }.bind(this));
    }

    showAllPostsUnresolved () {
        this.currentViewData = {
            "PageType": "Unanswered"
        };
        this.updateCurrentVideoSlide();
        this.cleanUpSearch();
        this.findUnresolved();
    }

    showAllPostsOfLecture () {
        this.currentViewData = {
            "PageType": "Lecture"
        };
        $(this.searchInputField).val("");
        this.dropdownMenu.switchToAllLecture();
        this.searchByText("");
        this.updateCurrentVideoSlide();
    }

    cleanUpSearch () {
        this.currWord = 0;
        this.notesWrapper.hide();
        $(this.searchInputField).val("");
        this.searchNoText();
        this.mark.unmark();
    }

    initializeSearch (text) {
        if (!this.dropdownMenu) 
            return;

        this.dropdownMenu.initializeSearch(text);
        this.currentViewData = {
            "PageType": "Unanswered"
        };
        this.updateCurrentVideoSlide();
    }


    // Optional param
    updateCurrentVideoSlide  (slideNo) {
        if (slideNo)
            this.videoCurrentSlide = slideNo;
        if (this.currentViewData["PageType"] != "Slide") {
            this.showNotifcationToUserForSlideTransition(this.videoCurrentSlide);
        }
        else if (this.currentViewData["SlideNo"] != this.videoCurrentSlide) {
            this.showNotifcationToUserForSlideTransition(this.videoCurrentSlide);
        }
        /*
        Add slide transition code here
        if (this.currentViewData["PageType"] != "Slide") {
            return this.videoCurrentSlide
        }
        else {
            return this.currentViewData['SlideNo'];
        }*/
    }

    showNotifcationToUserForSlideTransition (slideNo) {
        this.slideTransitionDiv.show();
        this.slideTransitionDiv.find(".rectangle-notif-slide-data").html("Slide " + slideNo).attr("data-slide", slideNo).css({"text-decoration": "none"});
    }
    startFormListeners (thisClass) {
        if (!this.OCRAudioLoaded) {
            setTimeout(function () {
                this.startFormListeners(this);
            }.bind(this), 500);
            return;
        }

        if (this.doneLoading) {
            this.doneLoading();
        }

        $(this.searchInputForm).on("submit", function (ev) {
            ev.preventDefault();
            var text = $(this.searchInputField).val().trim();
            if (text.length > 1) {
                this.loadingModule.show();
                this.searchByText(text);
                this.initializeSearch(text);
            }
            else if ($(this.searchInputField).val().trim().length == 0) {
                this.showAllPostsOfLecture ();
            }

        }.bind(this))
        $(this.searchInputField).on("input", function (ev) {
            var inputVal = $(this.searchInputField).val().trim();
            
            ev.preventDefault();
            if (inputVal.length > 1) {
                this.currWord = inputVal;
                setTimeout(function(input){
                    this.loadingModule.show();
                    if(input == this.currWord){
                        this.searchByText(input);
                        this.initializeSearch(input);
                    }
                    
                }.bind(this, inputVal), 200);
            }
            else if (inputVal.length == 0) 
               this.showAllPostsOfLecture ();
        }.bind(this));
    }


    detectTypeOfPostsToShow () {
        if (this.postFetchData['TypeOfFetch'] != "PodcastSearch") {
            $(this.mainDiv).parent().find(".dropdownOfSlide").parent().hide();
            $(this.mainDiv).parent().find(".dropdownOfSlide").css("padding", 0).hide();
            $(this.mainDiv).parent().find(".main_search_container_post").css("padding", 0).hide();
            $(this.mainDiv).parent().find(".search-module-main").css("padding-top", 0);
            $(this.searchModule).css("border", "none");
            this.shouldAllowNewComments = false;
        }
        else {
            this.shouldAllowNewComments = true;
        }
    }

    generateNewPost(text, timeOfPost, slideOfPost) {
        var obj = {
            "PodcastId": this.podcastid,
            "SlideOfPost": slideOfPost,
            "TimeOfPost": timeOfPost,
            "Content": text
        };
        callAPI(login_origins.backend + "/createPost", "POST", obj, function (postID) {
            var newPost = {
                "Name": this.userData["Name"],
                "PostId": postID, // get from callback
                "ProfilePic": this.userData["Pic"],
                "Content": text,
                "TimeOfPost": timeOfPost,
                "SlideOfPost": slideOfPost,
                "Comments": []
            };

            $(this.searchInputField).val("");
            this.loadPost(this, newPost, true);
            this.showAllPostsOfLecture();
        }.bind(this));
   
    }

    showNotes () {
        this.currentViewData = {
            "PageType": "Notes"
        };
        $(this.mainDiv).parent().find(".dropdownOfSlide").on("ShowNotes", function () {
            this.changeSlideCompletely();
            this.cleanUpSearch();
            this.notesWrapper.show();
            $(this.noResultsOption).hide();
        }.bind(this));
    }

    searchForSlide (slideNo) {
        var anyPostsShown = false;
        $(this.noResultsOption).hide();
        for (var x = 0; x < this.posts.length; x++) {
            anyPostsShown = this.posts[x].fetchBySlide(slideNo) || anyPostsShown;
        }
        var slideDataShown = this.displayOCRAndAudioForSlide(slideNo);
        anyPostsShown = anyPostsShown || slideDataShown;
        if (!anyPostsShown) {
            if (!$(this.noResultsOption).is(":visible"))
                $(this.noResultsOption).fadeIn();
        }
    }

    findUnresolved () {
        var anyPostsShown = false;
        $(this.noResultsOption).hide();
        for (var x = 0; x < this.posts.length; x++) {
            if (this.posts[x].getNumComments() == 0) {
                this.posts[x].showThisPost();
                anyPostsShown = true;
            }
            else 
                this.posts[x].hideThisPost();
        }
        if (!anyPostsShown) {
            if (!$(this.noResultsOption).is(":visible"))
                $(this.noResultsOption).fadeIn();
        }
    }


    setUpSlideTransitionModule () {
        loadHTMLComponent("SlideTransitionModule", function (data) {
            $(this.mainDiv).parent().find("#slide-transition-data").html(data);
        }.bind(this));
    }


    searchNoText () {
        this.mark.unmark();
        this.currentTextBeingSearched = 0;
        for (var x = 0; x < this.posts.length; x++) {
            this.posts[x].hideThisPost();
        }
        this.ocrModule.doSearchInAudio("");
        this.ocrModule.doSearchInOCR("");
    }

    searchByText (text) {
        this.mark.unmark();
        this.notesWrapper.hide();
        var bm = new BoyMor(text.toUpperCase());

        this.currentTextBeingSearched = text;
        
        var anyPostsShown = false;
        for (var x = 0; x < this.posts.length; x++) {
            var hasPostsShown = this.posts[x].searchForContent(text);
            anyPostsShown = (anyPostsShown || hasPostsShown );
        }
        var audioResults = this.ocrModule.doSearchInAudio(text);
        var ocrResults = this.ocrModule.doSearchInOCR(text);
        anyPostsShown = anyPostsShown || audioResults || ocrResults;
        if (!anyPostsShown) {
            if (!$(this.noResultsOption).is(":visible"))
                $(this.noResultsOption).fadeIn();
        }
        else {
            this.mark.mark(text, { 
                "caseSensitive" : false, 
                "separateWordSearch" : false,
                "exclude": [".pre-slide-data", ".slide-no"]
            })
            $(this.noResultsOption).hide();
        }

        setTimeout(function () {
            this.loadingModule.hide(); 
        }.bind(this), 500);
        
    }

    displayOCRAndAudioForSlide(slideNum) {
        this.mark.unmark();
        this.notesWrapper.hide();
        
        //var audioResults = this.ocrModule.fetchAudioForSlide(slideNum);
       // var ocrResults = this.ocrModule.fetchOCRForSlide(slideNum);
        return true;
    }

    remarkText () {
        if (this.currentTextBeingSearched != null && this.currentTextBeingSearched != 0) {
            this.mark.unmark();
            this.mark.mark(
                this.currentTextBeingSearched,
                {
                    "caseSensitive" : false,
                    "separateWordSearch" : false,
                     "exclude": [".pre-slide-data", ".slide-no"]
                }
            );
        }
    }

    generateDropdownMenu () {
        if (this.postFetchData["TypeOfFetch"] == "PodcastSearch") {
            this.dropdownMenu = new PodcastDropdownMenu(this.numberOfSlides, $(this.mainDiv).parent().find(".dropdownOfSlide"), this.parseSlides(this.slideTimes), this.videoURL);
        }
        
    }

    parseSlides (slides) {
        // Note that the slides themselves are indexed starting at 1
        var slideTimes = [];
        for (var x = 0; x < slides.length; x++) {
          slideTimes.push(slides[x]["StartTime"]/1000);
        }
        return slideTimes;
    }

    loadPostsFromServer (thisClass) {
        var postData = this.postFetchData;

        // Default to podcast search assumption
        var apiURL = login_origins.backend + "/getPostsForLecture";
        var requestData = {
            "PodcastId": postData["UniqueID"]
        };

        if (postData["TypeOfFetch"] == "CourseGlobal") {
            apiURL = login_origins.backend + "/getPostsForCourse";
            requestData = {
                "CourseId": postData["UniqueID"]
            };
        }
        else if (postData["TypeOfFetch"] == "CourseSearch") {
            apiURL = login_origins.backend + "/getPostsByKeyword";
            requestData = {
                "CourseId": postData["UniqueID"],
                "Keywords": postData["SearchQuery"]
            };
        }

        callAPI(apiURL, "GET", requestData, function (data) {
            // An array of posts are returned
            
            var length = data.length;
            if(postData["TypeOfFetch"] == "CourseSearch"){
                
                length = Math.min(data.length, 10);
            }
            for (var x = 0; x < length; x++) {
                this.loadPost(thisClass, data[x]);
            }
            if (postData["TypeOfFetch"] == "CourseSearch") {
                this.mark.mark(postData["SearchQuery"], { 
                    "caseSensitive" : false, 
                    "separateWordSearch" : false,
                    "exclude": [".pre-slide-data", ".slide-no"]
                })
            }

        }.bind(this));
    }

    loadPostModuleData (callback) {
        loadHTMLComponent("PostModule", function (data) {
            callback(data);
        });
    }


    loadPost (thisClass, postData, shouldPrepend) {
        thisClass.loadPostModuleData(function (postTemplate) {
            var newDiv = $(postTemplate);
            var newPostObj = new APost(postData, thisClass.userData, newDiv, thisClass.shouldAllowNewComments);

            if(thisClass.postFetchData.TypeOfFetch === "CourseGlobal" || 
              thisClass.postFetchData.TypeOfFetch === "CourseSearch"){
                var link_anchor = $(newDiv).find(".linker");
                link_anchor.attr('href', '#/podcast/' + postData['PodcastId'] + '/' + postData['SlideOfPost']);
                link_anchor.attr('style', 'text-decoration: none; color: inherit');
                //$(link_anchor).append(newDiv);
                //newDiv = link_anchor;
            }
            thisClass.posts.push(newPostObj);
            if (shouldPrepend)
                $(thisClass.mainDiv).prepend(newDiv);
            else
                $(thisClass.mainDiv).append(newDiv);

            // Must remark the text when a comment is added
            $(newDiv).on( "commentAdded", function() {
                thisClass.remarkText();
            });
        });

        /*if (!thisClass.isPodcastPage) {
            sr.reveal('.post-container', {
                container: '.search-module',
                reset: true
            });
        }*/

    }
    

}



