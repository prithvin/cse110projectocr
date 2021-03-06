var PodcastDropdownMenu = class PodcastDropdownMenu {
    
    // Dropdown shows all the slides
    // Unanswered questions (questions with no comments)
    // Notes
    // All slides (deafult search?)
    // Search made (connect this method with the podcast page)
    // By default SHOWS ALL POSTS IN LECTURE

    constructor(numSlides, divOfDropdown, slideTimes, videoURL) {
        this.mainDiv = divOfDropdown;
        this.slideTimes = slideTimes;
        this.videoURL = videoURL; // TODO 
        this.numSlides = numSlides;
        this.slideImages = [];
        this.dropdownMenuOptions = $(this.mainDiv).find(".dropdown-menu");
        this.slideDropdownItems = {};
        this.generateNonSlideOptions();
        this.generateDropdownForSlides();
        this.updateSlideTextListener();
        this.videoSeekerThumb();
        this.divOfHoverImage = $(divOfDropdown).prev(".hover-img");
        // Default value
        $(this.mainDiv).find("#dropdownSlideSelection").children("span").html("Entire Lecture");
    }

    getLoadCanvas(slideNo){
        var img = $("<img />").attr("src", './images/liquidbooks.gif');
        img.attr("data-slide", slideNo).addClass("slide-thumb-" + slideNo);
        return img;
    }
    listenToHoversNow() {
        $(this.mainDiv).find(".dropdown-item").on({
            mouseenter: function (ev) {
                var slideNo = $(ev.target).attr("data-slide");
                if (!slideNo)
                    return;

                this.divOfHoverImage.append(this.slideImages[slideNo - 1]);
                this.divOfHoverImage.show();
            }.bind(this),
            mouseleave: function (ev) {
                this.divOfHoverImage.hide();
                var slideNo = $(ev.target).attr("data-slide");
                if (slideNo) {
                    if (this.divOfHoverImage.find("img").length != 0)
                        this.divOfHoverImage.find("img").remove();
                    else
                        this.divOfHoverImage.find("canvas").remove();
                }

            }.bind(this)
        });
    }

    videoSeekerThumb () { 
        var index = 0;
        var video = $("<video /> ",  {
            src : this.videoURL
        })
        $(this.mainDiv).append(video);
        $(video).hide();
        
        video[0].addEventListener('loadeddata', function() {
            if (this.slideTimes.length > 0) {
                video[0].currentTime = this.slideTimes[0];
            }
        }.bind(this), false);

        this.listenToHoversNow();
        for (var x = 0; x < this.slideTimes.length; x++) {
            this.slideImages[x] = this.getLoadCanvas(x);
            $(this.slideImages[x]).addClass("hover-img");
        }
       

        video[0].addEventListener('seeked', function() {
            this.slideImages[index] = (this.generateThumbnail(video[0]));
            var loadingImg = $(this.divOfHoverImage).find(".slide-thumb-" + index);
            if (loadingImg.length != 0) {
                var parentContDiv = loadingImg.parent();
                parentContDiv.find("img").remove();
                parentContDiv.append(this.slideImages[index]);

            }

            $(this.slideImages[index]).addClass("hover-img");

            index++;
            if (index < this.slideTimes.length) {
                video[0].currentTime = this.slideTimes[index];
            }


        }.bind(this), false);
    }

    generateThumbnail(video) {
        var c = document.createElement("canvas");
        var ctx = c.getContext("2d");
        c.width = 640;
        c.height = 360;
        ctx.drawImage(video, 0, 0, 640, 360);
        return c;
    }

    generateNonSlideOptions () {
        var nonSlideOptions = ["Entire Lecture", "Unresolved Posts", "My Notes"];
        for (var x = 0; x < nonSlideOptions.length; x++) {
            var nextOpt = this.generateDropdownWithType(nonSlideOptions[x]);
            this.slideDropdownItems[nextOpt[x]] = nextOpt;
            this.dropdownMenuOptions.append(nextOpt);
        }
    }

    generateDropdownForSlides () {

        // Slides are one-indexed
        for (var x = 1; x <= this.numSlides; x++) {
            var nextSlide = this.generateOneDropdownForSlide(x);
            this.slideDropdownItems[x] = nextSlide;
            this.dropdownMenuOptions.append(nextSlide);
        }
    }

    updateSlideTextListener () {
        $(this.mainDiv).find(".dropdown-item").on("click", function (ev) {
            if ($(ev.target).html() == "Entire Lecture") {
                $(this.mainDiv).trigger("AllLecture", []);
            }
            if ($(ev.target).html() == "Unresolved Posts") {
                $(this.mainDiv).trigger("UnresolvedLecture", []);
            }
            if ($(ev.target).html() == "My Notes") {
                $(this.mainDiv).trigger("ShowNotes", []);
            }
            $(this.mainDiv).find("#dropdownSlideSelection").children("span").html($(ev.target).html());
        }.bind(this))

        

       
    }
    resetslides(){
        for(var i = 1; i <= this.numSlides; i++){
            this.slideDropdownItems[i].html("Slide " + i + " Feed");

        }
    }
    initializeSearch (text) {
        $(this.mainDiv).find("#dropdownSlideSelection").children("span").html("Search Results for \"" + text + "\" ");
    }
    switchToSlide (slideNo) {
        this.resetslides();
        $(this.mainDiv).find("#dropdownSlideSelection").children("span").html("Slide " + slideNo +  " Feed");
    }

    switchToAllLecture() {
        $(this.mainDiv).find("#dropdownSlideSelection").children("span").html("Entire Lecture");
    }

    generateDropdownWithType (type) {
        return $("<a>").addClass("dropdown-item").attr("data-type", type).html(type);
    }

    generateOneDropdownForSlide (slideNo) {
        return $("<a>").addClass("dropdown-item").addClass("slide-no").attr("data-slide", slideNo).html("Slide " + slideNo + " Feed");
    }


}

