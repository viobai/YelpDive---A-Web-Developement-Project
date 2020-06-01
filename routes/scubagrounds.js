var express = require("express");
var router = express.Router();
var ScubaSpot = require("../models/scubaSpot");
var middleware = require("../middleware");
var geocoder = require('geocoder');

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// index page
router.get("/",function(req,res){
	// if search bar is filled
	if(req.query.search && req.query.search != "") {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// Get all campgrounds from DB
		ScubaSpot.find().or([{ 'name': { $regex: regex }}, { 'nation': { $regex: regex }}, { 'region': { $regex: regex }}]).exec(
			function(err, allScubaSpots){
				if(err){
					console.log(err);
				} else {
					res.render("scubagrounds/index",{scubaSpots:allScubaSpots});
				}
			});
	// search bar is empty
	} else {
		ScubaSpot.find({},function(err,allScubaSpots){
			if(err){
				console.log(err);
			} else {
				if(req.xhr) {
					res.json(allScubaSpots);
				} else {
					// res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
					res.render("scubagrounds/index",{scubaSpots:allScubaSpots});
				}
			}
		});
	}
	// ScubaSpot.find({},function(err,allScubaSpots){
	// 	if(err){
	// 		console.log(err)
	// 	} else {
	// 		res.render("scubagrounds/index",{scubaSpots:allScubaSpots});
	// 	}
	// })
});

// about page
router.get("/about", function(req,res){
	res.render("scubagrounds/about");
});

// tips page
router.get("/tips", function(req,res){
	res.render("scubagrounds/tips");
});

// create - add new scuba ground to DB
router.post("/",middleware.isLoggedIn,function(req,res){
	var newName = req.body.name;
	var newImg = req.body.img;
	var newDesc = req.body.desc;
	var newNation = req.body.nation;
	var newRegion = req.body.region;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var location = newName + " " + newNation;
	geocoder.geocode(location, function(err,data){
		if (err||!data.length){
			req.flash('err','Invalid address');
			return res.redirect('back');
		}
		var lat = data.results[0].geometry.location.lat;
    	var lng = data.results[0].geometry.location.lng;
		var newScubaSpot = {name: newName,img:newImg, nation: newNation, region:newRegion, desc:newDesc, author:author, lat: newLat, lng: newLng};
		//create and save to mongoose
		ScubaSpot.create(newScubaSpot,function(err, newSpot){
			if (err){
				req.flash("error","...");
				console.log(err);
			}else{
				req.flash("success","New diving spot is added successfully.");
				res.redirect("/divingsites");
			}
		});
	});
});

// adding new scuba ground page
router.get("/new",middleware.isLoggedIn,function(req,res){
	res.render("scubagrounds/new");
});

// show - more info about one scuba spot
router.get("/:id", function(req,res){
	//find the scuba spot with provided provided
	ScubaSpot.findById(req.params.id).populate("comments").exec(function(err, foundSpot){
		if(err){
			console.log(err);
		} else {
			//render show template
			res.render("scubagrounds/show",{scubaspot: foundSpot});
		}
	});
});

// edit scuba scubagrounds
router.get("/:id/edit",middleware.isLoggedIn, middleware.checkScubaSpotOwnership, function(req,res){
	ScubaSpot.findById(req.params.id, function(err,foundSpot){
		res.render("scubagrounds/edit", {scubaspot:foundSpot});
	});
});

router.put("/:id",middleware.isLoggedIn, middleware.checkScubaSpotOwnership,function(req,res){
	var location = req.body.name + " " + req.body.nation;
	geocoder.geocode(location, function(err,data){
		if (err||!data.length){
			req.flash('err','Invalid address');
			return res.redirect('back');
		}
		
		ScubaSpot.findByIdAndUpdate(req.params.id,req.body.scubaspot,function(err,scubaSpot){
			if (err){
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				req.flash("success","Update successful!");
				res.redirect("/divingsites/"+ scubaSpot._id);
			}
		});
	});	
});

// destroy scuba scubagrounds
router.delete("/:id",middleware.checkScubaSpotOwnership,function(req,res){
	ScubaSpot.findByIdAndRemove(req.params.id,function(err){
		if (err){
			res.redirect("/divingsites");
		} else {
			req.flash("success","Delete successful.");
			res.redirect("/divingsites");
		}
	});
});


module.exports = router;