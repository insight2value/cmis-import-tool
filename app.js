const cookieParser = require('cookie-parser');
const cors = require('cors');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const multer = require('multer');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');
const upload = multer({ dest: 'uploads/' });

const cmisRouter = require('./routes/cmis');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// view engine setup
app
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'pug')

  .use(logger('dev'))
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(upload.any())
  .use(cors())
  .use(cookieParser())
  .use(sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true, // true = .sass and false = .scss
    sourceMap: true
  }))
  .use(express.static(path.join(__dirname, 'public')))

  .use('/', indexRouter)
  .use('/cmis', cmisRouter)
  .use('/users', usersRouter)

  // catch 404 and forward to error handler
  .use(function (req, res, next) {
    next(createError(404));
  })

  // error handler
  .use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

module.exports = app;
