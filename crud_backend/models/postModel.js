// Create a schema
var mongoose = require('mongoose');
var PostModel = new mongoose.Schema({
    SlideId: Number,
  	LectureId: Number, // this is in the schema, the _id cannot be an umber. its an aes something encrypted id
  	ProfilePicture: String,
  	NameOfUser: String,
    SlideId: Schema.Types.ObjectId,
  	PodcastId: Schema.Types.ObjectId,
    UserId: Schema.Types.ObjectId,
    isComment: Boolean,
  	TimeOfPost: Number,
  	Content: String,
  	Responses: [Schema.Types.ObjectId]
});

// Create a model based on the schema
var PostModel = mongoose.model('PostModel', PostModel);

module.exports = {PostModel: PostModel}
