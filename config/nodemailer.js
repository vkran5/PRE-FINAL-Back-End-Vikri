const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user : 'vikriagung6@gmail.com',
        pass: 'eqabwnaahnpkgxip'
    }
});

module.exports = {
    transport
}