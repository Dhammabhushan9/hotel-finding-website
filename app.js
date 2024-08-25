const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync.js");
const ejsMate = require('ejs-mate');
const { listingschema,reviewschema } = require('./schema.js');
const mongoose = require("mongoose");
const Listing = require('./models/listing.js');
const ExpressError = require('./utils/ExpressError.js');
const Review = require('./models/r.js');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

main().then(() => {
  console.log("connected");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderhub');
}

// Middleware to validate the request body for creating/updating listings
const validateListing = (req, res, next) => {
  const { error } = listingschema.validate(req.body);
  if (error) {
    const message = error.details.map(el => el.message).join(', ');
    throw new ExpressError(400, message);
  } else {
    next();
  }
};

const validatereview = (req, res, next) => {
  const { error } = reviewschema.validate(req.body);
  if (error) {
    const message = error.details.map(el => el.message).join(', ');
    throw new ExpressError(400, message);
  } else {
    next();
  }
};
reviewschema
// Middleware to validate the MongoDB ObjectId
const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid ID"));
  }
  next();
};

// Routes
app.get("/listing/show", wrapAsync(async (req, res) => {
  const alllist = await Listing.find({});
  res.render("./listing/index.ejs", { alllist });
}));
app.post("/listing/:id/review", validatereview, wrapAsync(async (req, res) => {
  console.log(`POST request received at /listing/${req.params.id}/review`);
  const listing = await Listing.findById(req.params.id);
  const newReview = new Review(req.body.review);
  console.log(newReview)
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  console.log(listing);

  res.redirect(`/listing/${listing._id}`)
}));


app.get("/", (req, res) => {
  res.send("yo my booy");
});

app.get("/listing/new", (req, res) => {
  res.render("./listing/new.ejs");
});

app.get("/listing/:id", validateId, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const l = await Listing.findById(id).populate("reviews");
  if (!l) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("./listing/show.ejs", { l });
}));

app.post("/listings", validateListing, wrapAsync(async (req, res) => {
  const listing = req.body.listing;
  const newList = new Listing(listing);
  await newList.save();
  res.redirect("/listing/show");
}));

app.get("/listing/:id/edit", validateId, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const l = await Listing.findById(id);
  if (!l) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("./listing/edit.ejs", { l });
}));

app.put("/listings/:id", validateId, validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect("/listing/show");
}));

app.delete("/listings/:id", validateId, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const dellist = await Listing.findByIdAndDelete(id);
  if (!dellist) {
    throw new ExpressError(404, "Listing not found");
  }
  res.redirect("/listing/show");
}));

// delet revirw
app.delete("/listing/:id/review/:reviewid", wrapAsync(async (req, res) => {
  console.log("hiiiiiiii");
  
  let { id, reviewid } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewid } });
  await Review.findByIdAndDelete(reviewid);

  res.redirect(`/listing/${id}`);
}));

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "No page found"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).render("./listing/error", { message: err.message });
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});

