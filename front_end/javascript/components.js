window.appModules = {};

var baseModuleURL = "./views/"
var loadHTMLModules = {
    "CommentModule": "comment_module.html",
    "CourseHomepageModule": "course_homepage_module.html",
    "CourseSearchModule": "course_search_module.html",
    "SearchResultsModule" : "search_videos_module.html",
    "CourseVideosModule": "course_videos_module.html",
    "LoaderModule": "loader_module.html",
    "MenuModule": "menu_module.html",
    "OnboardingCoursesModule": "onboarding_courses_module.html",
    "OnboardingFrontPage": "onboarding_module.html",
    "PodcastModule": "podcast_module.html",
    "PostModule": "post_module.html",
    "PostSearchModule": "post_search_module.html",
    "VideoModule": "video_module.html",
    "AudioOCRSubMod": "audio_ocr_search_sub_module.html",
    "AudioOCRMod": "audio_ocr_search_module.html",
    "SlideTransitionModule": "slide_transition_module.html",
    "RecommendationsModule": "recommendations_module.html",
    "NotesModule": "notes_module.html",
    "SearchCardModule": "search_card_module.html",
    "SearchCardIndvModule": "search_card_indv_mod.html",
    "SeeMoreTinySearchCardModule": "seemore_div_module.html"
};

preloadComponents();
function preloadComponents () {
    for (key in loadHTMLModules) {
        loadHTMLComponent(key, function () { });
    }
}

function loadComponent (moduleName, divToLoad, callback) {
    if (loadHTMLModules[moduleName] == null) {
        console.log("Invalid module");
        return;
    }
    loadHTMLComponent(moduleName, function (data) {
        $(divToLoad).html(data);
        callback();
    });
}

function loadComponentOrLogin (moduleName, divToLoad, callback) {   
    callAPI(login_origins.backend + '/isUserLoggedIn', 'GET', {}, function (loginStatus) {
        if(loginStatus === true) {
            loadComponent(moduleName, divToLoad, callback);
        }
        else {
          window.location.href = window.location.origin + window.location.pathname + '#/?redirectURL=' + encodeURIComponent(window.location.href);
        }
    });
}

function loadHTMLComponent (moduleName, callback) {

    if (window.appModules[moduleName] != null)  {
        callback(window.appModules[moduleName]);
        return;
    }

    var filePath = baseModuleURL + loadHTMLModules[moduleName];

    $.ajax({
        url: filePath,
        data: {},
        success: function (data) {
            window.appModules[moduleName] = data;
            callback(data);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("Something went wrong when loading " + fileName);
            console.log("Status: " + textStatus + " Error: " + errorThrown);
        }
    });
}


function callAPI (targetURL, type, callData, callback) {
    $.ajax({
        url: targetURL,
        data: callData,
        type: type,
        xhrFields: {
          withCredentials: true
        },
        success: function (data) {
            callback(data);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            console.warn("API call to  " + targetURL + " failed");;
        } 
    });
}


// GLOBAL JQUERY OVERRIDE
$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});
