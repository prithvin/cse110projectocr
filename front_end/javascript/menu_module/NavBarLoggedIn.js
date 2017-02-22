var NavBarLoggedInCourse = class NavBarLoggedInCourse {
    constructor (mainDiv, classID) {
        this.mainDiv = mainDiv;
        

        var self = this;
        this.fetchUserData(function (userName, userPic) {
            self.setUserName(userName);
            self.setProfPic(userPic);
        });

        this.fetchCourseData(classID, function (className, classQuarter) {
            self.setClassName(className);
            self.setClassQuarter(classQuarter);
            self.setPlaceHolder(className, classQuarter);
        });
        this.setCoursesHyperLink(this);
        this.loadAutocomplete();
    }

    fetchCourseData(classID,  callback) {
        callAPI("./fake_data/getCourse.json", "GET", {}, function (data) {
            callback(data['CourseName'],  data['ClassQuarter']);
        });
    }

    fetchUserData (callback) {
        callAPI("./fake_data/getUser.json", "GET", {}, function (data) {
            callback(data['Name'], data['Pic']);
        });
    }

    setClassName(className) {
        $(this.mainDiv).find("#className").html(className);
    }

    setClassQuarter(classQuarter) {
        $(this.mainDiv).find("#classQuarter").html(classQuarter);
    }

    setPlaceHolder(className, classQuarter) {
        $(this.mainDiv).find("#searchBar").attr("placeholder", "Search in " + className + " " + classQuarter);
    }

    setUserName(userFirstName) {
        $(this.mainDiv).find("#firstName").html(userFirstName);
    }


    setProfPic (userPicture) {
        $(this.mainDiv).find("#userProfPic").attr("src", userPicture)
    }

    setCoursesHyperLink (thisClass) {
        $(this.mainDiv).find("#course_button").on("click", function () {
            $(thisClass.mainDiv).trigger( "goToCourseOnboarding", [] );
        })
    }
    
    loadAutocomplete() {
        var apiURL = "./fake_data/searchResults.json";
        var availableTags = [];
        callAPI(apiURL, "GET", {}, function (data) {
            for(var x = 0; x < data["Videos"].length; x++) {
                $.extend(availableTags, data["Videos"][x]["Keywords"]);
            }
        });
        $( "#searchBar" ).autocomplete({
            source: availableTags,
            minLength: 3
        });
    }
}

/* Recent Search */
var availableTags = [];
function recentSearch() {
    var text = document.getElementById('searchBar').value;
    if ($.inArray(text, availableTags) == -1)
        availableTags.push(text);
    $( "#searchBar" ).autocomplete({
        source: availableTags,
        minLength: 3
    });
    $( "#secondary-search-bar" ).autocomplete({
        source: availableTags,
        minLength: 3
    });
}