require('dotenv').config()
const { MongoClient, ObjectID } = require("mongodb")
const express = require("express")
const BodyParser = require('body-parser')
const { response } = require("express")
const path = require('path')
const { appendFile } = require("fs")

const server = express()

server.use(BodyParser.json())
server.use(BodyParser.urlencoded({ extended: true }))

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

// UPLOAD DATA
server.post("/submit-art", async (req, res) => {
    try {
        console.log(req.body)
        let result = await artCollection.insertOne(req.body)
        // res.send(result)
        res.render("entry-result.ejs", {result: result})
    } catch (e) {
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