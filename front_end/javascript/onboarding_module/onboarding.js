var Onboarding = class Onboarding {
  constructor(mainDiv, callback) {
    this.checkUserLogStatus(function () {
      callback();
    })
    

    var fbAppId = "1606385449650440";
    if (window.location.hostname == "localhost") {
      fbAppId = "1604407836236361";
    }
  
    FB.init({
      appId: fbAppId,
      version: 'v2.4'
    });

    var self = this;
    var errorString = "Looks like you did not log into Facebook correctly. Try again!";
    $(mainDiv).find('.fb-login-button').on("click", function ()  {
      FB.login(function(response) {
        if (response.status === 'connected') {
          FB.api('/me', function(response) {

            callAPI(login_origins.backend + '/loginorcreate', 'GET', response, function (data) {
              if (data == true)
                window.location.href = self.getCallbackURL();
              else
                swal("Oops!", errorString);
            });
          });
        } 
        else {
          swal("Oops!", errorString)
        }
      }, {scope: 'public_profile,email'});
    });

    
  }

  getCallbackURL () {
    var callbackURL = window.location.origin + window.location.pathname + "#/courses";
    if (this.getParameterByName("redirectURL"))
      callbackURL = this.getParameterByName("redirectURL");
    return callbackURL;
  }

  checkUserLogStatus (callback) {
    var errorString = "Looks like you did not log into Facebook correctly. Try again!";
    FB.login(function(response) {
      if (response.status === 'connected') {
        callAPI(login_origins.backend + '/isUserLoggedIn', 'GET', {}, function (data) {
          if(data === true) {
            if (this.getParameterByName("redirectURL"))
              window.location.href = this.getParameterByName("redirectURL");
            else
              window.location.hash =  '/courses';
          }
          callback();
        }.bind(this));
      } 
      else {
        swal("Oops!", errorString)
      }
    }, {scope: 'public_profile,email'});
    
  }

  getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

}
