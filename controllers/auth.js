const { dbConf, dbQuery } = require('../config/db');
const { hashPassword, createToken } = require('../config/encrypt');
const { transport } = require('../config/nodemailer');

module.exports = {
    getData: (req, res) => {
        dbConf.query('Select * from users;',
            (err, results) => {
                if (err) {
                    console.log('Error quey SQL :', err);
                    res.status(500).send(err);
                }

                res.status(200).send(results)
            })
    },
    register: async (req, res) => {
        let { username, email, password } = req.body;

        try {
            let sqlInsert = await dbQuery(`INSERT INTO users (username, email, password) 
            values ('${username}', '${email}',  '${hashPassword(password)}');`);

            if (sqlInsert.insertId) {
                let sqlGet = await dbQuery(`Select idusers, email, status_id, verification, reset_password from users where idusers=${sqlInsert.insertId}`);

                // Generate token
                let token = createToken({ ...sqlGet[0] }, '1h');

                await dbQuery(`UPDATE users u SET verification = ${dbConf.escape(`${token}`)} 
                WHERE u.idusers = ${sqlInsert.insertId};`)

                // Mengirimkan email
                await transport.sendMail({
                    from: 'ESHOP ADMIN CARE',
                    to: sqlGet[0].email,
                    subject: 'Verification email account',
                    html: `
                    <html lang="en">
        
                    <style>
                    #main {
                        margin-top: 200px;
                    }
                
                    .text-center {
                        text-align: center;
                        color: purple;
                    }
                
                    .text-oswald {
                        font-family: 'Oswald', sans-serif;
                    }
                
                    .btn{
                        position: relative;
                        bottom: 12px;
                        padding: 6px 8px;
                        background-color: purple;
                        border: none;
                        border-radius: 5px;
                    }
                
                    .btn > a{
                        text-decoration: none;
                        color: white;
                    }
                    </style>
                    
                    <body id="main" class="bg-purple">
                        <h3 class="text-center text-oswald">Email Address Verification</h3>
                    
                        <div class="text-center text-oswald">
                            <p>Halo ${sqlGet[0].email.split('@')[0]}, welcome to Posty! Thank you so much for signing up! we're happy to have you with us.</p>
                            <p>Secure your Posty account by verifying your email address. Click the link below to verify your account and start socialize with your new friends.</p>
                            <br>
                            <button class="btn"><a href="${process.env.FE_URL}/verification/${token}">Verify Account</a><br></button>
                            <br>
                            <p>This verification will be expired in 24 hours. If this email verification address expired. Please send email verification  again.</p>
                        </div>
                    
                    </body>
                    
                    </html>        
                    `
                })
                res.status(200).send({
                    success: true,
                    message: 'Register Success'
                })
            }

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    login: async (req, res) => {
        const { username, email, password } = req.body;

        try {
            let resUsers = await dbQuery(`SELECT u.idusers, u.fullname, u.username, u.status_id, s.status , u.email, u.bio, u.profile_img, u.verification, u.reset_password FROM users u 
            JOIN status s ON u.status_id = s.idstatus 
            ${username ? `WHERE u.username  = ${dbConf.escape(username)}` : `WHERE u.email  = ${dbConf.escape(email)}`}  AND u.password = ${dbConf.escape(hashPassword(password))} ;`)

            if (resUsers.length > 0) {
                let resPost = await dbQuery(`SELECT u.idusers, u.username, u.email,  p.idposts, p.image, p.caption, p.likes, p.date FROM  users u
                JOIN posts p ON p.user_id = u.idusers
                WHERE p.user_id = ${dbConf.escape(resUsers[0].idusers)};`);

                let token = createToken({ ...resUsers[0] });

                res.status(200).send({
                    ...resUsers[0],
                    token,
                    post: resPost

                });
            } else {
                res.status(404).send({
                    success: false,
                    message: 'Login failed'

                });
            }

        } catch (error) {
            res.status(500).send(error);
            console.log(error);
        }
    },
    keepLogin: async (req, res) => {

        let resUsers = await dbQuery(`SELECT u.idusers, u.profile_img, u.fullname, u.username, u.email, u.bio, s.status, u.verification, u.reset_password from users u 
        JOIN status s on u.status_id = s.idstatus
        WHERE u.idusers = ${dbConf.escape(req.dataToken.idusers)};`)

        if (resUsers.length > 0) {
            let resPost = await dbQuery(`SELECT u.idusers, u.username, u.email,  p.idposts, p.image, p.caption, p.likes, p.date FROM  users u
            JOIN posts p ON p.user_id = u.idusers
            WHERE p.user_id = ${dbConf.escape(resUsers[0].idusers)};`);

            let token = createToken({ ...resUsers[0] });

            res.status(200).send({
                ...resUsers[0],
                token,
                post: resPost

            });
        }
    },
    editProfile: async (req, res) => {
        try {
            const { username, fullname, bio } = req.body;
            await dbQuery(`UPDATE users u SET username = ${dbConf.escape(username)}, fullname = ${dbConf.escape(fullname)}, bio =  ${dbConf.escape(bio)} 
            WHERE u.idusers = ${req.params.id};`)

            res.status(200).send({ username, fullname, bio })
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    editProfileImg: async (req, res) => {
        try {
            console.log(req.files[0].filename);
            await dbQuery(`UPDATE users u SET profile_img = ${dbConf.escape(`/imgProfile/${req.files[0].filename}`)} 
            WHERE u.idusers = ${req.params.id};`);

            res.status(200).send({ success: true });

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },
    sendVerify: async (req, res) => {

        console.log(req.dataToken.idusers);

        let sqlGet = await dbQuery(`Select idusers, email, status_id from users where idusers = ${req.dataToken.idusers}`);
        console.log(sqlGet[0].email);

        let token = createToken({ ...sqlGet[0] }, '1h');

        await dbQuery(`UPDATE users u SET verification = ${dbConf.escape(`${token}`)} 
                WHERE u.idusers = ${req.dataToken.idusers};`)


        await transport.sendMail({
            from: 'POSTY ADMIN CARE',
            to: sqlGet[0].email,
            replacement: token,
            subject: 'Email Adress Verification',
            html: `
            <html lang="en">

            <style>
            #main {
                margin-top: 200px;
            }
        
            .text-center {
                text-align: center;
                color: purple;
            }
        
            .text-oswald {
                font-family: 'Oswald', sans-serif;
            }
        
            .btn{
                position: relative;
                bottom: 12px;
                padding: 6px 8px;
                background-color: purple;
                border: none;
                border-radius: 5px;
            }
        
            .btn > a{
                text-decoration: none;
                color: white;
            }
            </style>
            
            <body id="main" class="bg-purple">
                <h3 class="text-center text-oswald">Email Address Verification</h3>
            
                <div class="text-center text-oswald">
                    <p>Halo ${sqlGet[0].email.split('@')[0]}, welcome to Posty! Thank you so much for signing up! we're happy to have you with us.</p>
                    <p>Secure your Posty account by verifying your email address. Click the link below to verify your account and start socialize with your new friends.</p>
                    <br>
                    <button class="btn"><a href="${process.env.FE_URL}/verification/${token}">Verify Account</a><br></button>
                    <br>
                    <p>This verification will be expired in 24 hours. If this email verification address expired. Please send email verification  again.</p>
                </div>
            
            </body>
            
            </html>        
            `
        })

        res.status(200).send({
            success: true,
            message: 'Verify Send'
        })


    },
    verify: async (req, res) => {
        try {
            if (req.dataToken.idusers) {
                await dbQuery(`UPDATE users set status_id = 2 WHERE idusers = ${dbConf.escape(req.dataToken.idusers)}`);

                let resUser = await dbQuery(`SELECT u.idusers, u.fullname,  u.username, u.status_id, s.status , u.email, u.bio, u.profile_img, u.verification FROM users u 
                JOIN status s ON u.status_id = s.idstatus
                WHERE idusers = ${dbConf.escape(req.dataToken.idusers)};`)

                if (resUser.length > 0) {
                    let token = createToken({ ...resUser[0] })

                    res.status(200).send({
                        success: true,
                        message: 'Verify success',
                        dataLogin: {
                            ...resUser[0],
                            token
                        },
                        error: ''
                    })
                } else {
                    res.status(401).send({
                        success: false,
                        messagae: 'Failed to verify',
                        dataLogin: {},
                        error: ''
                    })
                }
            }

        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                messagae: 'Failed to verify'
            })
        }
    },
    sendResetPassword: async (req, res) => {
        let sqlGet = await dbQuery(`Select idusers, email, status_id from users where idusers = ${dbConf.escape(req.params.idusers)};`);
        console.log(sqlGet);

        let token = createToken({ ...sqlGet[0] }, '24h');

        await dbQuery(`UPDATE users u SET reset_password = ${dbConf.escape(`${token}`)} 
                    WHERE u.idusers = ${req.params.idusers};`)


        await transport.sendMail({
            from: 'POSTY ADMIN CARE',
            to: sqlGet[0].email,
            replacement: token,
            subject: 'Reset Password',
            html: `
                <html lang="en">
    
                <style>
                #main {
                    margin-top: 200px;
                }
            
                .text-center {
                    text-align: center;
                    color: purple;
                }
            
                .text-oswald {
                    font-family: 'Oswald', sans-serif;
                }
            
                .btn{
                    position: relative;
                    bottom: 12px;
                    padding: 6px 8px;
                    background-color: purple;
                    border: none;
                    border-radius: 5px;
                }
            
                .btn > a{
                    text-decoration: none;
                    color: white;
                }
                </style>
                
                <body id="main" class="bg-purple">
                    <h3 class="text-center text-oswald">Reset Password</h3>
                
                    <div class="text-center text-oswald">
                        <p>Halo ${sqlGet[0].email.split('@')[0]}, as you request the link for reset password</p>
                        <p>Here's the link for reset your new password</p>
                        <br>
                        <button class="btn"><a href="${process.env.FE_URL}/reset/${token}">Reset Password</a><br></button>
                        <br>
                        <p>This email will be expired in 24 hours. If this email expired or invalid. Please send new request!</p>
                    </div>
                
                </body>
                
                </html>        
                `
        })

        res.status(200).send({
            success: true,
            message: 'Verify Send'
        })
    },
    resetPassword: async (req, res) => {
        try {
            if (req.dataToken.idusers) {
                await dbQuery(`UPDATE users set password = ${dbConf.escape(hashPassword(req.body.password))} WHERE idusers = ${dbConf.escape(req.dataToken.idusers)}`);
                console.log(req.dataToken.idusers);
                res.status(200).send({
                    success: true,
                    message: 'Reset password success',
                    error: ''
                })

            }

        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                messagae: 'Failed reset password'
            })
        }
    }
}