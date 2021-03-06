var APost = class APost {

    constructor (postData, userData, mainDiv, shouldAllowNewComments) {

        // Set up globals
        this.postData = postData;
        this.userData = userData;
    
        // DOM elements
        this.mainDiv = $(mainDiv);
        this.commentDiv = $(this.mainDiv).find(".comments");
        this.commentForm = $(this.mainDiv).find(".comment-form");
        this.numOfComments = this.postData["Comments"].length;


        this.loadHeader(this.postData["Name"], this.postData["ProfilePic"]);
        this.loadMainContent(this.postData["Content"], this.postData["TimeOfPost"], this.postData["SlideOfPost"]);
        this.loadCommentContent(this, this.postData["Comments"]);
        this.postID = this.postData["PostId"];

        if (shouldAllowNewComments) {
            this.addCommentListener(this);
        }
        else {
            $(this.commentForm).hide();
        }

        if (this.postData && this.postData.LectureDate) {
            this.generateClickableLecturePost(this.postData.LectureDate);
        }
    }

    generateClickableLecturePost(lectureDate) {
        var slideDiv = $(this.mainDiv).find(".slide-no");
        $(slideDiv).html($(slideDiv).html() + " • " + moment(lectureDate).format("MMM Do")).attr("data-podcast", this.postData.PodcastId);
    }
    
    addCommentListener (thisClass) {
        $(this.commentForm).on("submit", function (ev) {
            ev.preventDefault();
            if ($(thisClass.mainDiv).find(".comment-answer").val().trim().length > 0) {
                thisClass.addComment(
                    $(thisClass.mainDiv).find(".comment-answer"), 
                    thisClass.userData["Pic"], 
                    thisClass.userData["Name"], 
                    new Date().getTime()
                );
            }
        })
    }

    getNumComments () {
        return this.numOfComments;
    }

    addComment (inputForm, userPic, userName, timeOfComment) {
        var text = $(inputForm).val();
        var obj = {
            "Content": text,
            "Time": timeOfComment,
            "PostId": this.postID
        };
        callAPI(login_origins.backend + "/createComment", "POST", obj, function () {
            this.loadIndividualComment({
                "Pic": userPic,
                "PosterName": userName,
                "Content": text,
                "Time": timeOfComment
            });
            this.numOfComments++;
            $( this.mainDiv ).trigger( "commentAdded", [] );
            $(inputForm).val("");
        }.bind(this));
    }

    searchForContent (searchTerm) {
        var isSearch = $(this.mainDiv).is(':contains("' + searchTerm + '")');
        if (isSearch) { 
            this.showThisPost();
            return true;
        }
        else {
            this.hideThisPost();
            return false;
        }
    }

    fetchBySlide (slideNo) {
        var isGoodSlide = ($($(this.mainDiv).find(".slide-no")).attr("data-slide") == slideNo);
        if (isGoodSlide) {
            this.showThisPost();
            return true;
        }
        else {
            this.hideThisPost();
            return false;
        }
    }

    hideThisPost () {
        $(this.mainDiv).hide();
    }

    showThisPost () {
        $(this.mainDiv).show();
    }

    loadHeader (name, pic) {
        $(this.mainDiv).find(".profile-pic-post").attr("src", pic);
        $(this.mainDiv).find(".name-of-poster").find("span").html(name);
    }

    loadMainContent (content, time, slideOfPost) {
        var timeString = moment(new Date(time) , "YYYYMMDD").fromNow();
        $(this.mainDiv).find(".time-sig-nat-lang").html(timeString);

        this.slideNo = slideOfPost;

        $(this.mainDiv).find(".slide-no").html("Slide " + slideOfPost).attr("data-should-auto-transition", false).attr("data-slide", slideOfPost).css({"text-decoration": "none"});;
        
        $(this.mainDiv).find(".post-main-content").find("span").html(content);
    }

    loadCommentContent (thisClass, comments) {
        loadHTMLComponent("CommentModule", function (data) {
            thisClass.commentModule = data;

            for (var x = 0; x < comments.length; x++) {
                thisClass.loadIndividualComment(comments[x]);
            }
        });       
    }

    loadIndividualComment (commentData) {
        var newComment = $(this.commentModule);
        $(newComment).find(".comment-pic-holder").attr("src", commentData["Pic"]);
        $(newComment).find(".comment-poster-name").html(commentData["PosterName"]);
        $(newComment).find(".comment-post-content").html(commentData["Content"]);
        $(newComment).find(".comment-time").html(moment(new Date(commentData["Time"]) , "YYYYMMDD").fromNow());
        $(this.commentDiv).append(newComment);
    }
}

/* Sample call

new APost(
    {"Name": "Rauhmel Bob",
     "ProfilePic": "http://3.bp.blogspot.com/-AMQ283sRFI4/VeMuQ2FeLdI/AAAAAAAC_4k/cWfG1Hmg4d8/s1600/Miley_Cyrus_E%2521_NEWS.jpg", 
     "Content": "This is a test post with some random data just to test the functionality", 
     "TimeOfPost": 1486659593882, 
     "SlideOfPost": 5,
     "Comments": [
     {
        "Pic" : "http://3.bp.blogspot.com/-AMQ283sRFI4/VeMuQ2FeLdI/AAAAAAAC_4k/cWfG1Hmg4d8/s1600/Miley_Cyrus_E%2521_NEWS.jpg",
        "PosterName" : "Rauhmel Tob",
        "Content" : "This is a really cool test commement",
        "Time" : 1486691019627
     },
     {
        "Pic" : "http://3.bp.blogspot.com/-AMQ283sRFI4/VeMuQ2FeLdI/AAAAAAAC_4k/cWfG1Hmg4d8/s1600/Miley_Cyrus_E%2521_NEWS.jpg",
        "PosterName" : "LOL Bob",
        "Content" : "This is a really cool test commement and it is going to be abbsurdley long to test a weird edge case that wil hopefully not break everything",
        "Time" : 1486691009627
     }
     ]
    }, "Prithvi Narasimhan", "http://pages.stern.nyu.edu/~sbp345/websys/phonegap-facebook-plugin-master/src/android/facebook/FacebookLib/res/drawable/com_facebook_profile_picture_blank_square.png", null, $(".post-container"))

*/