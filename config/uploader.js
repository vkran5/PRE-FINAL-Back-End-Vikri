const multer = require('multer');
const fs = require('fs');

module.exports = {
    uploader: (directory, filePrefix) => {
        let defaultDir = './public';

        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? defaultDir + directory : defaultDir;

                if (fs.existsSync(pathDir)) {
                    console.log('Directory exist');
                    cb(null, pathDir)
                } else {
                    fs.mkdir(pathDir, {recursive: true}, (err) => {
                        if (err) {
                            console.log('Mkdir error!');
                        }

                        console.log(`success mkdir ${pathDir}`);
                        return cb(err, pathDir)
                    })
                }
            },

            filename: (req, file, cb) => {
                let ext = file.originalname.split('.');

                let newName = filePrefix + Date.now() + '.' + ext[ext.length - 1];
                console.log('new file name', newName);
                cb(null, newName)
            }
        })

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(jpg|png|webp|jpeg|svg|avif)/;

            if (file.originalname.toLowerCase().match(extFilter)) {
                cb(null, true)
            } else {
                cb(new Error('Your file ext are denied ❌', false));
            }
        }

        return multer({ storage: storageUploader, fileFilter })
    }
}