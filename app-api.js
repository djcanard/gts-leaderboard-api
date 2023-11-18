const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');
const app = express();

let corsDomain;
if (process.env.NODE_ENV === "development") {
  corsDomain = "*";
} else {
  corsDomain = "https://www.mtbparts.nl";
}

const corsOptions = {
  origin: corsDomain,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOptions));

// page routing
app.use('/', require('./routes/index'));

// api routing
app.use('/cars', require('./routes/cars'));
app.use('/categories', require('./routes/categories'));
app.use('/courses', require('./routes/courses'));
app.use('/courseranking', require('./routes/courseranking'));
app.use('/profiles', require('./routes/profiles'));
app.use('/dailyraces', require('./routes/dailyraces'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
