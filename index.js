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
  description: String,
  duration: Number,
  date: String,
  from: String,
  to: String,
  count: Number,
  log: [Object],
});
const User = mongoose.model("User", userSchema);

app.post("/api/users", urlencodedParser, function (req, res) {
  let uname = req.body.username;

  let user = new User({
    username: uname,
  });
  user.save((err, data) => {
    if (err) console.err(err);
    console.log(data);
    res.json({
      username: data.username,
      _id: data._id,
    });
  });
});

app.get("/api/users", function (req, res) {
  User.find({}, "_id username", function (err, data) {
    if (err) console.err(err);
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", urlencodedParser, function (req, res) {
  let id = req.body._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date_input = req.body.date;
  let date, date_format;

  if (date_input === "") {
    date = new Date();
  } else {
    date = new Date(date_input);
  }
  date_format = date.toDateString();

  let newvalue = {
    description: description,
    duration: duration,
    date: date_format,
  };
  User.updateOne({ _id: id }, newvalue, function (err, data) {
    if (err) console.err(err);
    else console.log("Successfully updated!");
  });
  User.findById(id, function (err, data) {
    if (err) console.log(err);
    data.log.push(newvalue);
    data.count = data.log.length;
    data.save();
    console.log(data);
  });
  User.find(
    { _id: id },
    "_id username date description duration ",
    function (err, data) {
      if (err) console.err(err);
      console.log(data);
      res.json(data[0]);
    }
  );
});

app.get("/api/users/:_id/logs", function (req, res) {
  let id = req.params._id;
  if (Object.keys(req.query).length !== 0) {
    let from = new Date(req.query.from);
    let to = new Date(req.query.to);
    let limit = req.query.limit;
    console.log(from, to, limit);
    User.findById(id, "_id username from to count log", function (err, data) {
      if (err) console.log(err);
      data.from = from.toDateString();
      data.to = to.toDateString();

      const gettime = (str) => {
        let d = new Date(str);
        return d.getTime();
      };
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
      console.log(data);
    });
  } else {
    User.findById(id, "_id username  count log", function (err, data) {
      if (err) console.err(err);
      res.json(data);
      console.log(data);
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
