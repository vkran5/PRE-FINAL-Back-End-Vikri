const express = require('express');
const { readToken } = require('../config/encrypt');
const route = express.Router();
const { uploader } = require('../config/uploader')
const { postController } = require('../controllers');

const uploadFile = uploader('/imgPost', 'IMGPOST').array('image', 1)

route.get('/', postController.getPost);
route.get('/load/:offset/:limit', postController.loadPost);
route.post('/', uploadFile, postController.addpost);
route.delete('/:id', postController.deletePost);
route.patch('/edit/:id', postController.editCaption);
route.get('/detail/:id', postController.postDetails)
route.get('/getlikes/:id', postController.getLikes); 
route.post('/like', postController.likePost); 
route.delete('/unlike/:id', postController.unlikePost);
route.get('/liked', readToken, postController.likedPost);
route.get('/comment/:id', postController.getComment);
route.get('/loadcomment/:id', postController.loadComment);
route.post('/add/comment', postController.addComment);
route.get('/ownpost', readToken, postController.ownPosts);

module.exports = route;