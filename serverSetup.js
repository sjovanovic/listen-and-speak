
const serverSetup = {
    distPath: '', // static directory to serve, default is './dist'
    allowExtensions: ['yaml'], // array of file extensions to be allowed besides standard extensions (html, css, images ...)
    callback: (server, app) => { // node server, express app
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        }); 
    }
}

export default serverSetup