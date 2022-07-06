require('dotenv').config()
const { MongoClient, ObjectID } = require("mongodb")
const express = require("express")
// const BodyParser = require('body-parser')
// const { response } = require("express")
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

// server.use(BodyParser.json())
// server.use(BodyParser.urlencoded({ extended: true }))

server.set('views', "./views")
server.set('view engine', "ejs")

server.use(express.static('public'))
server.use('/images', express.static(path.join(__dirname, 'public', 'images')))
server.use('/css', express.static(path.join(__dirname, 'public', 'styles')))


const client = new MongoClient(process.env.LUKE_ATLAS_URI)
const port = process.env.PORT || 3000
var artCollection
var galleryCollection

server.listen(port, async () => {
    try {
        await client.connect()
        artCollection = client.db("coler-museum").collection("artwork")
        galleryCollection = client.db("coler-museum").collection("gallery-data")
        console.log("Listening at port: " + port)
    } catch (e) {
        console.error(e)
    }
})

// Home page
server.get("/", (req, res) => {
    res.render("home.ejs")
})

server.get("/galleries", (req, res) => {
    res.render("galleries.ejs")
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
    console.log("Going to submit new art...")
    res.render("art-entry-form.ejs")
})