var SearchCardClass = class SearchCardClass {

    /*
        Data: {LectureTime, Matches: {SlideNo, Text, Type, Time (if applicable)}   PodcastId, PodcastImage}
    */
    constructor (mainDiv, searchTerm, data) {
        
        this.mainDiv = $(mainDiv);
        this.data = data;
        this.mark = new Mark($(this.mainDiv)[0]);
        this.searchTerm = searchTerm;
        
        // Update DOM stuff
        $(this.mainDiv).find(".lecture-image-search").attr("src", data['PodcastImage']);
        this.title = $(mainDiv).find(".video-card-title");

        // Listeners and stuff
        $(this.title).html(moment(data['LectureTime']).format("dddd, MM/DD"));
        this.clickedImage();

        
        loadHTMLComponent("SearchCardIndvModule", function (htmlComponent) {
            this.cardModule = htmlComponent;
            this.appendOCRandAudio(this.mainDiv, data);
        }.bind(this));

        this.mark.mark(searchTerm, { 
            "caseSensitive" : false, 
            "separateWordSearch" : false,
            "exclude": [".pre-slide-data", ".slide-no"]
        })
        
    }

    clickedImage () {
        $(this.mainDiv).find(".lecture-image-search").on("click", function (ev) {
            window.location.hash = '#/podcast/' + this.data['PodcastId'];
        }.bind(this));
    }
    
    appendOCRandAudio(cardDiv, data) {    
        var matches = data.Matches;
        for (var i = 0; i < matches.length; i ++) {
            var ocrText = $(this.cardModule);
            ocrText.find(".content-span").html(this.generateMatch(matches[i].Text));
            if (matches[i].Type == "AUDIO")
                ocrText.find(".pre-slide-data").html("Audio match on");
            else
                ocrText.find(".pre-slide-data").html("Slide match on");
            ocrText.find(".slide-no").attr("data-slide", matches[i].SlideNo).html("Slide " + matches[i].SlideNo);
            $(cardDiv).append(ocrText);
        }
    }   

    generateMatch(text) {
        var searchTerm = this.searchTerm;
        var pattern = new RegExp(searchTerm, 'gi');

        var splittedString = text.split(pattern);
        var newString = "";
        for (var x = 1; x < splittedString.length; x++) 
            newString += this.getFiveDiffs(splittedString[x - 1], searchTerm, splittedString[x]);
        return newString;
    }

    getFiveDiffs (left, term, right) {
        var newLeft = left.split(' ').slice(0, 5).join(' ');
        var term = " " + term + " ";

        var splitRight = right.split(' ');
        var newRight = splitRight.slice(splitRight.length - 5).join(' ');

        return "..." + newLeft + term  + newRight + "...\n";
        
    }

    getFirstFiveString (text) {
        return ;
    }
}
