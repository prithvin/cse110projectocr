var PodcastPage = class PodcastPage {

    constructor (podcastID, mainDiv) {
        this.mainDiv = mainDiv;
        this.podcastID = podcastID;
        this.fetchUserData(this);
        this.loadNavbar(this);
        this.fetchVideo(this);
    }

    fetchUserData (thisClass) {
        callAPI("./fake_data/getUser.json", "GET", {}, function (data) {
            thisClass.UserName = data['Name'];
            thisClass.UserPic = data['Pic'];
            thisClass.loadPosts(thisClass);
        });
    }


    // The two methods below must be TODO
    fetchStartTimeBasedOnSlide () {

    }

    fetchStartingSlide () {

    }

    fetchVideo (thisClass) {
        callAPI("./fake_data/getVideo.json", "GET", {"PodcastID": this.podcastID}, 
            function (data) {
                 console.log(data);
                thisClass.loadVideo(thisClass, data['VideoURL'], 0, data['SRTFile']);
            }
        );
    }

    dynamicWindowResize (thisClass) {
        $(window).on("resize", function() {
            if ($(thisClass.mainDiv).length == 0) {
                $('#myimage').off('click.mynamespace');
            }
            else {
                thisClass.updatePostHeights();
            }
        });
    }

    loadNavbar (thisClass) {
        require(['navbar'], function () {
            var divToLoad = $(thisClass.mainDiv).find("#navbox");
            loadComponent("MenuModule", divToLoad, function () {
                new NavBarLoggedInCourse(
                    divToLoad,
                    thisClass.podcastID
                );
            });
        });
    }

    loadPosts (thisClass) {
        require(['postSearch'], function () {
            var divToLoad = $(thisClass.mainDiv).find("#podcast-posts");
            loadComponent("PostSearchModule", divToLoad, function () {
                new PostSearch(
                    {
                        "UniqueID": thisClass.podcastID,
                        "TypeOfFetch": "PodcastSearch"
                    },
                    {
                        "Name": thisClass.UserName, 
                        "Pic": thisClass.UserPic
                    },
                    divToLoad
                );
                setTimeout(function () {
                    thisClass.updatePostHeights() 
                }, 500);
                thisClass.dynamicWindowResize(thisClass);
            });
        });
    }

    loadVideo (thisClass, url, startTime, srtFile){
        require(['video-wrapper'], function(){
            var divToLoad = $(thisClass.mainDiv).find("#video-space");

            loadComponent("VideoModule", divToLoad, function () {
                new videoClass(url, 0, divToLoad, srtFile);
            });

        });                
    }
    updatePostHeights() {
        var newHeight =$(window).height() - $(this.mainDiv).find("#navbox").height();
        $(this.mainDiv).find("#podcast-posts").css("height",newHeight );
    }
};