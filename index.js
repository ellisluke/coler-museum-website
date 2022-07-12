require('dotenv').config()
const { MongoClient, ObjectID, MongoUnexpectedServerResponseError, ObjectId } = require("mongodb")
const express = require("express")
const BodyParser = require('body-parser')
const { response } = require("express")
const path = require('path')
const { appendFile } = require("fs")
const multer = require("multer")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images/uploads")
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage})

const server = express()

// Login dependencies
const bcrypt = require('bcrypt')
const passport = require('passport')
const session = require('express-session')
const flash = require("express-flash")



server.use(BodyParser.json())
server.use(BodyParser.urlencoded({ extended: true }))

server.set('views', "./views")
server.set('view engine', "ejs")

server.use(express.static('public'))
server.use('/images', express.static(path.join(__dirname, 'public', 'images')))
server.use('/css', express.static(path.join(__dirname, 'public', 'styles')))
server.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')))

server.use(session({
    secret: "aqu457mcf06$%^&@",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }
}))

const client = new MongoClient(process.env.LUKE_ATLAS_URI)
const port = process.env.PORT || 3000
var artCollection
var galleryCollection
var userCollection
var gallery


server.listen(port, async () => {
    try {
        await client.connect()
        artCollection = client.db("coler-museum").collection("artwork")
        galleryCollection = client.db("coler-museum").collection("gallery-data")
        userCollection = client.db("coler-museum").collection("users")
        console.log("Listening at port: " + port)
    } catch (e) {
        console.error(e)
    }
})

// Home page
server.get("/", async (req, res) => {
    let gals = await galleryCollection.find({}).project({galleryname: 1}).toArray()
    res.render("home.ejs", {galleries: gals})
    
})

server.get("/galleries", (req, res) => {
    res.render("galleries.ejs")
})

server.get('/login', (req, res) => {
    if (req.session.admin == true) {
        res.redirect("/admin")
    }
    res.render("login.ejs", {message: ""})
})

server.post('/login', async (req, res) => {
    try {
        let userData = await userCollection.findOne()
        req.session.admin = false
        if (req.body.username == userData.username) {
            bcrypt.compare(req.body.password, userData.password, (err, result) => {
                if (result) {
                    req.session.admin = true
                    res.redirect("/admin")
                }
            })
        } else {
            res.render("login.ejs", {message: "Login attempt failed."})
        }
        
        
        // if (req.body.username == userData.username && req.body.password == userData.password) {
        //     res.send("success!")
        // } else {
        //     res.send("failure!")
        // }
    } catch (e) {
        res.send("uh oh")
    }
})

// ADMIN PAGE
server.get("/admin", async (req, res) => {
    // Make sure user is logged in
    if (!req.session.admin) {
        res.redirect('/')
    }
    else {
        try {
            var galleryData = await galleryCollection.find({}).toArray()
            // async function to build array of actual art data
            res.render("admin.ejs", {gallery: galleryData})
        } catch (e) {
            res.send(e)
        } 
    } 
    // res.render("admin.ejs", galleryData)
})

server.get("/admin-manage", async (req, res) => {
    // comment out next three lines for login work around
    // if (!req.session.admin) {
    //     res.redirect('/')
    // } else {
        try {
            var pieces = await artCollection.find({}).project({ title: 1, artistname: 1, filename: 1}).toArray()
            res.render("admin-manage.ejs", {art: pieces})
        } catch (e) {
            res.send(e)
        }
    // }

})

server.get("/edit-art=:art_id", async (req, res) => {
    try {
        console.log("Requested data for art id: " + req.params.art_id)
        let details = await artCollection.findOne({"_id": ObjectId(req.params.art_id)})
        res.render("edit-art.ejs", {details: details})
        
    } catch (e) {
        res.send(e)
    }
})

server.post("/edit-art=:art_id", async (req, res) => {
    try {
        let result = await artCollection.updateOne({"_id": ObjectId(req.params.art_id)}, {$set: req.body})
        res.send(result)
    } catch (e) {
        res.send(e)
    }
})

server.post("/delete-art=:delete_id", async (req, res) => {
    try {
        // DELETE IMAGE AS WELL???
        let result = await artCollection.deleteOne({"_id": ObjectId(req.params.delete_id)})
        res.redirect("/admin-manage")
    } catch (e) {
        res.send(e)
    }
})

// These two are for admin's gallery management page
server.get("/manage-gallery=:galleryID", async (req, res) => {
    try {
        // gallery = client.db("coler-museum").collection("gallery-" + req.params.galleryNum)
        galleryContents = await galleryCollection.findOne({"_id": ObjectId(req.params.galleryID)})
        // var artIDs = galleryContents.displaysIDs

        // galleryContents.forEach(piece => {
        //     artIDs.push(ObjectId(piece.art_id))
        // });

        // get all art data, used for filling inital boxes and dropdowns
        let artData = await artCollection.find({}).project({title: 1, artistname: 1, filename: 1}).toArray()

        // var artData = await artCollection.find({"_id": {"$in": artIDs}}).toArray()
        res.render("manage-gallery.ejs", {
            galID: req.params.galleryID, 
            gallery: galleryContents, 
            art: artData })
        // res.send(galleryContents)
    } catch (e) {
        res.send(e)
    }
})

server.post("/manage-gallery=:galleryID", async (req, res) => {
    try {
        let result = await galleryCollection.updateOne(
            {"_id": ObjectId(req.params.galleryID)}, 
            {$set: {
                "displaysIDs": req.body.art_id,
                "gallerydesc": req.body.gallerydesc,
                "galleryname": req.body.galleryname
            }})
        res.redirect("/manage-gallery=" + req.params.galleryID)
    } catch (e) {
        res.send(e)
    }
    
})

server.get("/specific-art=:art_id", async (req, res) => {
    let specificArt = await artCollection.findOne({"_id": ObjectId(req.params.art_id)})
    res.send(specificArt)
})

// UPLOAD DATA
server.post("/submit-art", upload.single("image"), async (req, res) => {
    try {
        console.log(req.body)
        let result = await artCollection.insertOne(req.body)
        const new_id = result.insertedId
        let file_add = await artCollection.updateOne(
            {"_id": new_id},
            { $set: {"filename": req.file.filename}}
        )
        res.render("entry-result.ejs", {result: result, file_result: file_add})
    } catch (e) {
        console.log(e)
        res.status(500).send("DIDN'T WORK :(")
    }
})

// FETCH DATA
server.get("/fetch_art", async (req, res, next) => {
    try {
        console.log("Art has been requested!")
        let result = await artCollection.find({}).toArray()
        res.send(result)
    } catch (e) {
        res.status(500).send("OH NO!")
    }
})

// To fetch image, go to domain /images/ tall-cat.jpg

server.get("/all_art", async (req, res) => {
    try {
        console.log("All records have been requested!")
        let result = await artCollection.find({}).toArray()
        res.render("phone-gallery.ejs", {results: result})
    } catch (e) {
        res.status(500).send("FAILURE")
    }
})

server.get("/gallery-data", async(req, res) => {
    try {
        console.log("Gallery data has been requested!")
        let result = await galleryCollection.find({}).toArray()
        res.send(result)
    } catch (e) {
        res.status(500).send("FAILURE")
    }
})

server.get("/enter-art", async (req, res) => {
    if (!req.session.admin) {
        res.redirect('/')
    }
    res.render("art-entry-form.ejs")
})