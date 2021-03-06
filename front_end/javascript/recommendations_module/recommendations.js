var Recommendations = class Recommendations {
  constructor(mainDiv, podcastid) {
    this.podcastid = podcastid;

    this.getRecommendations(function (recommendations, lecturedate) {
      
      this.displayRecomm($(mainDiv).find('.podcast-recommendations'), recommendations);
      $(mainDiv).find(".lecture-date").html(moment(lecturedate).format("dddd, MM/DD"));

    }.bind(this));
   
  }

  displayRecomm(rec_div, recommendations) {
    var numRecs = 0;
    for(var recommendation of recommendations) {
      numRecs++;
      if (numRecs == 5)
        return;
      var id = recommendation['PodcastId'];
      var preview_src = recommendation['PodcastImage'];
      var title = recommendation['Time'];

      var link_anchor = document.createElement('a');
      link_anchor.href = "#/podcast/" + id;

      var rec_container = document.createElement('div');
      $(rec_container).addClass('rec-container pure-u-6-24');
        
      var highlight = document.createElement('div');
      highlight.className = "enlarge";

      var preview_img = document.createElement('img');
      preview_img.src = preview_src;
      $(preview_img).addClass('rec-preview-img');

      var rec_title = document.createElement('div');
      rec_title.textContent = new Date(title).toDateString();
      $(rec_title).addClass('rec-title');

      highlight.appendChild(preview_img);
      highlight.appendChild(rec_title);
      rec_container.appendChild(highlight);

      $(link_anchor).append(rec_container);
      $(rec_div).append(link_anchor);
    }
  }

  getRecommendations(callback) {
    callAPI(login_origins.backend + '/getRecommendations', 'GET', {"PodcastId": this.podcastid}, (data) => {
      callback(data['Recommendations'], data['Time']);

    });
  }
}
