const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT;
const bearerToken = require('express-bearer-token')

app.use(express.json()); // membaca bod.req
app.use(cors());
app.use(express.static('public'));
app.use(bearerToken())

app.get('/', (req, res) => {
    res.status(200).send('<h1>POSTY API</h1>');
})

// DB connection
const { dbConf } = require('./config/db');
dbConf.getConnection((err, connection) => {
    if (err) {
        console.log('Error MySql connection:', err.sqlMessage);
    }

    console.log('Connected to MySQL ✅:', connection.threadId);
})

// CONFIGURASI ROUTERS
const { authRouter, postController } = require('./routers');
app.use('/auth', authRouter);
app.use('/post', postController);

app.listen(PORT, () => console.log(`Running at ${PORT}`));
