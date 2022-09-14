const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({ extended: false });
const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://Lizzie:T6yVMVDg11ZVAA2P@cluster0.eje3c95.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
const userSchema = new mongoose.Schema({
  username: String,
  from: String,
  to: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});
const User = mongoose.model("User", userSchema);

app.post("/api/users", urlencodedParser, function (req, res, next) {
  let uname = req.body.username;

  let user = new User({
    username: uname,
  });

  user
    .save()
    .then((data) =>
      res.json({
        username: data.username,
        _id: data._id,
      })
    )
    .catch((err) => next(err));
});

app.get("/api/users", function (req, res) {
  User.find({}, "_id username")
    .then((data) => res.json(data))
    .catch((err) => next(err));
});

app.post(
  "/api/users/:_id/exercises",
  urlencodedParser,
  function (req, res, next) {
    let id = req.body._id;
    let description = req.body.description;
    let duration = Number(req.body.duration);
    let date_input = req.body.date;
    let date, date_format;

    if (date_input === "") {
      date = new Date();
    } else {
      date = new Date(date_input);
    }
    if (date == "Invalid Date") {
      throw new Error("Invalid Date!");
    }
    if (description == "" || duration == "") {
      throw new Error("Description and duration are required!");
    }

    date_format = date.toDateString();

    let newvalue = {
      description: description,
      duration: duration,
      date: date_format,
    };

    User.findOne({ _id: id })
      .then((data) => {
        data.log.push(newvalue);
        data.count = data.log.length;
        data.save();
        res.json({
          username: data.username,
          description: description,
          duration: duration,
          date: date_format,
          _id: id,
        });
      })
      .catch((err) => {
        next(err);
      });
  }
);

app.get("/api/users/:_id/logs", function (req, res) {
  let id = req.params._id;
  let from, to, limit;
  if (Object.keys(req.query).length !== 0) {
    if (req.query.from) {
      from = new Date(req.query.from);
    } else {
      from = new Date("1970-01-01");
    }
    if (req.query.to) {
      to = new Date(req.query.to);
    } else {
      to = new Date();
    }
    if (req.query.limit) {
      limit = req.query.limit;
    } else {
      limit = 10000;
    }
    const gettime = (str) => {
      let d = new Date(str);
      return d.getTime();
    };

    User.findById(id, "_id username from to count log")
      .then((data) => {
        data.from = from.toDateString();
        data.to = to.toDateString();
        let result = data.log.filter((item) => {
          return (
            gettime(item.date) >= gettime(data.from) &&
            gettime(item.date) <= gettime(data.to)
          );
        });
        let arr = result.slice(0, limit);

        data.save();
        res.json({
          _id: id,
          username: data.username,
          from: data.from,
          to: data.to,
          count: arr.length,
          log: arr,
        });
      })
      .catch((err) => next(err));
  } else {
    User.findById(id, "_id username  count log")
      .then((data) => {
        res.json(data);
      })
      .catch((err) => next(err));
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
