var autokeys = [];
var NavBarLoggedInCourse = class NavBarLoggedInCourse {

    // ClassID COULD EITHER BE A PODCAST OR A CLASSID IT CAN BE SOMETHINg. 
    constructor (mainDiv, classID) {
        this.mainDiv = mainDiv;
        this.course = "";
        this.quarter = "";
        

        /* Autocorrect */
        this.norvig;

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
        
        this.initAutocomplete(classID);
    }

    fetchCourseData(classID,  callback) {
        callAPI(login_origins.backend + '/getCourseInfo', 'GET', {'CourseId': classID}, function(data) {
            callback(data['Course'], data['Quarter']);
            this.setHomeHyperLink(data['Id']);
        }.bind(this));
    }

    fetchUserData (callback) {
        callAPI(login_origins.backend + '/getUser', "GET", {}, function (data) {
            callback(data['Name'], data['Pic']);
        });
    }

    setClassName(className) {
        this.course = className;
        $(this.mainDiv).find("#className").html(className);
    }

    setClassQuarter(classQuarter) {
        this.quarter = classQuarter;
        $(this.mainDiv).find("#classQuarter").html(classQuarter);
    }

    setPlaceHolder(className, classQuarter) {
        $(this.mainDiv).find("#searchBar").attr("placeholder", "Search in " + className + " " + classQuarter);
    }

    setUserName(userFirstName) {
        $(this.mainDiv).find("#firstName").html(userFirstName.substring(0, userFirstName.indexOf(' ')));
    }


    setProfPic (userPicture) {
        $(this.mainDiv).find("#userProfPic").attr("src", userPicture)
    }

    setCoursesHyperLink (thisClass) {
        $(this.mainDiv).find("#course_button").on("click", function () {
            var baseURL = window.location.origin + window.location.pathname;
            var targetURL = baseURL + "#/courses";
            window.location.href = targetURL;
            window.location.hash =  "/courses";
        })
    }
    
    setHomeHyperLink (classID) {
        var windowHash = "#/courses/" + classID;
        if (classID == null) {
            windowHash = "#/courses";
        }
        $(this.mainDiv).find("#home_button").on("click", function () {
            window.location.hash = windowHash;
        }.bind(this))
        $(this.mainDiv).find("#home_button2").on("click", function () {
            window.location.hash = windowHash;
        }.bind(this))
    }
    
    
    initAutocomplete(classID) {
        var self = this;
        
        callAPI(login_origins.backend + '/getKeywordSuggestions', "GET", {'count': 50, 'minKeywordLength': 5, 'CourseId': classID}, function (data) {
            console.log(data);
            var keys = localStorage.getItem("autokeys");
            if (keys !== null) autokeys = keys.split(",");
            $.extend(autokeys, data);
            $("#searchBar").autocomplete({
                source: autokeys,
                minLength: 2,
                open: function () { 
                    $('ul.ui-autocomplete').removeClass('closed');
                    $('ul.ui-autocomplete').addClass('opened');  
                },
                close: function () {
                    $('ul.ui-autocomplete').removeClass('opened').css('display', 'block');
                    $('ul.ui-autocomplete').addClass('closed');
                },
            });
        });
        
        /*
        callAPI(apiURL2, "GET", {}, function (data) {
            self.norvig = new Norvig(data["Dictionary"]);
        });*/
        
        document.getElementById("searchBar").addEventListener("change", function() {
            //self.autocorrect();
            var text = document.getElementById('searchBar').value.toLowerCase();
            if ($.inArray(text, autokeys) == -1 && text.length > 2)
                autokeys.push(text);
            localStorage.setItem("autokeys", autokeys);
        });                   
    }
    
    autocorrect() {
        var self = this;
        var text = document.getElementById('searchBar').value;
        if (text.length > 2) {
            var splitText = text.split(" ");
            var correction = "";
            var corrected = "";
            var x = 0;

            /* Correct each word */
            for (; x < splitText.length - 1; x++) {
                if (splitText[x].length > 13) {
                    continue;
                }
                corrected = self.norvig.correct(splitText[x]);
                if (typeof corrected === "undefined")
                    corrected = splitText[x];       // keep user's word
                correction += corrected + " ";
            }

            /* Last Word */
            console.log("user: " + splitText[x])
            if (splitText[x].length > 13) {
                console.log("Cannot autocorrect: " + splitText[x])
            } else {
                corrected = self.norvig.correct(splitText[x]);
                console.log("corrected: " + corrected);
                if (typeof corrected === "undefined")
                    corrected = splitText[x];           // keep user's word
                correction += corrected;
            }

            correction = correction.toLowerCase();
            if (typeof correction === "undefined") {
                return;
            } else {
                document.getElementById('searchBar').value = correction;
                console.log("correction: " + correction);
            }  
        }
    }
}