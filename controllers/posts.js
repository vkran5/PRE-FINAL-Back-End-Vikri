const { dbConf, dbQuery } = require('../config/db');

module.exports = {
    getPost: async (req, res) => {
        try {
            let resPost = await dbQuery(`SELECT p.idposts, p.user_id, p.likes , u.username, u.profile_img , p.caption, p.date, p.image from posts p 
            JOIN users u ON u.idusers = p.user_id
            ORDER BY idposts DESC
            LIMIT 3`)

            res.status(200).send(resPost);

        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    },
    loadPost: async (req, res) => {
        try {
            let resPost = await dbQuery(`SELECT p.idposts, p.user_id, p.likes , u.username, u.profile_img , p.caption, p.date, p.image from posts p 
            JOIN users u ON u.idusers = p.user_id
            ORDER BY idposts DESC
            LIMIT ${req.params.limit} OFFSET ${req.params.offset}`)

            res.status(200).send(resPost);

        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    },
    addpost: async (req, res) => {
        try {
            let data = JSON.parse(req.body.data);

            let dataInput = [];
            for (const prop in data) {
                dataInput.push(dbConf.escape(data[prop]))
            }

            dataInput.splice(1, 0, dbConf.escape(`/imgPost/${req.files[0].filename}`));

            await dbQuery(`INSERT INTO posts (user_id, image, caption) values (${dataInput.join(',')})`);

            res.status(200).send({ success: true })

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    likePost: async (req, res) => {
        try {
            await dbQuery(`INSERT INTO likes (user_id, post_id) VALUES (${dbConf.escape(req.body.user_id)}, ${dbConf.escape(req.body.post_id)});`)

            let resPost = await dbQuery(`SELECT * from likes l
            JOIN posts p ON p.idposts = l.post_id ;`)

            res.status(200).send(resPost)

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    unlikePost: async (req, res) => {
        try {
            await dbQuery(`DELETE from likes where idlikes = ${dbConf.escape(req.params.id)}`)

            res.status(200).send({
                success: true,
                message: 'Post Unliked'
            })
        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    },
    getLikes: async (req, res) => {
        try {
            let resLiked = await dbQuery(`SELECT * from likes where post_id = ${req.params.id};`);
            let resPost = await dbQuery(`UPDATE posts set likes = ${resLiked.length} WHERE idposts = ${req.params.id};`);

            // console.log(resPost);
            res.status(200).send(resLiked)

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    likedPost: async (req, res) => {
        try {
            let resPost = await dbQuery(`SELECT l.idlikes, p.idposts, p.user_id, p.image, p.caption, p.date, u.username, u.profile_img  from likes l 
            JOIN posts p ON p.idposts = l.post_id
            JOIN users u ON u.idusers = p.user_id
            WHERE l.user_id = ${dbConf.escape(req.dataToken.idusers)}
            ORDER BY idlikes DESC;`)

            res.status(200).send(resPost)

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    postDetails: async (req, res) => {
        try {
            let resPost = await dbQuery(`SELECT p.idposts, p.user_id , u.username, u.profile_img , p.likes, p.caption, p.date, p.image from posts p 
            JOIN users u ON u.idusers = p.user_id
            WHERE p.idposts = ${req.params.id}`)

            res.status(200).send(resPost);

        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    },
    deletePost: async (req, res) => {
        try {
            await dbQuery(`DELETE from posts where idposts = ${req.params.id}`);

            res.status(200).send({
                success: true,
                message: 'Post Deleted'
            })

        } catch (error) {
            console.log(error);
            res.staus(500).send(error)
        }
    },
    editCaption: async (req, res) => {
        try {
            await dbQuery(`UPDATE posts p SET caption = ${dbConf.escape(req.body.caption)} WHERE p.idposts = ${req.params.id};`)

            res.status(200).send({
                success: true,
                message: 'message updated'
            })

        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }

    },
    ownPosts: async (req, res) => {
        try {
            let resPost = await dbQuery(`SELECT p.idposts, p.user_id , u.username, u.profile_img , p.likes, p.caption, p.date, p.image from posts p 
            JOIN users u ON u.idusers = p.user_id
            WHERE p.user_id = ${dbConf.escape(req.dataToken.idusers)}
            ORDER BY p.idposts DESC;`)

            res.status(200).send(resPost);

        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    },
    getComment: async (req, res) => {
        try {
            console.log(req.params.id);

            let resComment = await dbQuery(`Select u.username, c.comment, c.date from comments c JOIN users u on c.user_id = u.idusers
            WHERE c.post_id = ${dbConf.escape(req.params.id)}
            ORDER BY idcomments DESC
            LIMIT 5;`);

            res.status(200).send(resComment)

            console.log(resComment);
        } catch (error) {
            console.log(error);
            res.status(500).send(
                {
                    getComment: false
                }
            )
        }

    },
    loadComment: async (req, res) => {
        try {
            console.log(req.params.id);

            let resComment = await dbQuery(`Select u.username, c.comment, c.date from comments c JOIN users u on c.user_id = u.idusers
            WHERE c.post_id = ${dbConf.escape(req.params.id)}
            ORDER BY idcomments DESC;`);

            res.status(200).send(resComment);

        } catch (error) {
            console.log(error);
            res.status(500).send(
                {
                    getComment: false
                }
            )
        }
    },
    addComment: async (req, res) => {
        try {
            const { user_id, post_id, comment } = req.body
            await dbQuery(`INSERT INTO comments (user_id, post_id, comment) values (${dbConf.escape(user_id)}, ${dbConf.escape(post_id)}, ${dbConf.escape(comment)});`)

            res.status(200).send({
                success: true,
                message: 'Comment Added'
            })

        } catch (error) {
            console.log(error);
            res.status(500).send(
                {
                    suuccess: false
                }
            )

        }
    }
}