var PodcastDropdownMenu = class PodcastDropdownMenu {
    
    // Dropdown shows all the slides
    // Unanswered questions (questions with no comments)
    // Notes
    // All slides (deafult search?)
    // Search made (connect this method with the podcast page)
    // By default SHOWS ALL POSTS IN LECTURE

    constructor(numSlides, divOfDropdown) {
        this.mainDiv = divOfDropdown;
        this.numSlides = numSlides;
        this.dropdownMenuOptions = $(this.mainDiv).find(".dropdown-menu");
        this.slideDropdownItems = {};
        this.generateNonSlideOptions();
        this.generateDropdownForSlides();
        this.updateSlideTextListener();
    }

    generateNonSlideOptions () {
        var nonSlideOptions = ["Entire Lecture", "Unresolved Posts"];
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
            $(this.mainDiv).find("#dropdownSlideSelection").children("span").html($(ev.target).html());
        }.bind(this))
    }

    switchToSlide (slideNo) {
        $(this.mainDiv).find("#dropdownSlideSelection").children("span").html($(this.slideDropdownItems[slideNo]).html());
    }

    generateDropdownWithType (type) {
        return $("<a>").addClass("dropdown-item").attr("data-type", type).html(type);
    }

    generateOneDropdownForSlide (slideNo) {
        return $("<a>").addClass("dropdown-item").addClass("slide-no").attr("data-slide", slideNo).html("Slide " + slideNo + " Feed");
    }


}