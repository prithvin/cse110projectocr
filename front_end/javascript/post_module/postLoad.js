var APost = class APost {

    constructor (params, currentUserName, currentUserPic, currentUserAuthToken, postDiv, controller) {
        this.params = params;
        this.mainDiv = $(postDiv);
        this.controller = controller;
        this.commentDiv = $(postDiv).find(".comments");
        this.loadHeader(this.params["Name"], this.params["ProfilePic"]);
        this.loadMainContent(this.params["Content"], this.params["TimeOfPost"], this.params["SlideOfPost"]);
        this.loadCommentContent(this.params["Comments"]);
        this.postId = this.params["PostId"];

        var parentClass = this;
        $(this.mainDiv).find(".comment-form").on("submit", function (ev) {
            ev.preventDefault();
            console.log(parentClass.postId);
            parentClass.addComment($(parentClass.mainDiv).find(".comment-answer"), currentUserPic, currentUserName, new Date().getTime());
        })
    }

    addComment (inputForm, userPic, userName, timeOfComment) {
        this.loadIndividualComment({
            "Pic": userPic,
            "PosterName": userName,
            "Content": $(inputForm).val(),
            "Time": timeOfComment
        });
        if (this.controller != null) {
            this.controller.remarkText();
        }
        $(inputForm).val("");
    }

    searchForContent (searchTerm) {
        var isSearch = $(this.mainDiv).is(':contains("' + searchTerm + '")');
        if (isSearch)
            this.showThisPost();
        else
            this.hideThisPost();
    }

    fetchBySlide (slideNo) {
        var isGoodSlide = $($(this.mainDiv).find(".slide-no")).is(':contains("Slide ' + slideNo + '")');
        if (isGoodSlide)
            this.showThisPost();
        else
            this.hideThisPost();
    }

    hideThisPost () {
        $(this.mainDiv).fadeOut(500);
    }

    showThisPost () {
        $(this.mainDiv).fadeIn(500);
    }

    loadHeader (name, pic) {
        $(this.mainDiv).find(".profile-pic-post").attr("src", pic);
        $(this.mainDiv).find(".name-of-poster").html(name);
    }

    loadMainContent (content, time, slideOfPost) {
        var timeString = moment(new Date(time) , "YYYYMMDD").fromNow();
        $(this.mainDiv).find(".time-sig-nat-lang").html(timeString);

        this.slideNo = slideOfPost;

        $(this.mainDiv).find(".slide-no").html("Slide " + slideOfPost);
        
        $(this.mainDiv).find(".post-main-content").find("span").html(content);
    }

    loadCommentContent (comments) {
        var parentClass = this;
        loadHTML("comment_module.html", function (data) {
            parentClass.commentModule = data;

            for (var x = 0; x < comments.length; x++) {
                parentClass.loadIndividualComment(comments[x]);
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