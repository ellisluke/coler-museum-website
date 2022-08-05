require('dotenv').config()
const { MongoClient, ObjectID, MongoUnexpectedServerResponseError, ObjectId } = require("mongodb")
const express = require("express")
const webRequest = require("request")
const BodyParser = require('body-parser')
const { response } = require("express")
const cors = require('cors')
const path = require('path')
const { appendFile } = require("fs")
const { auth, requiresAuth } = require('express-openid-connect')


// File Upload Configuration
const multer = require("multer")
const maxFile = 5 * 1024 * 1024; // 5 MB max file size
const { Storage } = require('@google-cloud/storage')
const { resolveSoa } = require('dns')
const { request } = require('http')

const storage = new Storage({keyFilename: "google-cloud-key.json"})
const bucket = storage.bucket(process.env.BUCKET_NAME)

const mult = multer({ 
    storage: multer.memoryStorage(),
    limits: {fileSize: maxFile}
})


const server = express()


server.use(BodyParser.json())
server.use(BodyParser.urlencoded({ extended: true }))

server.set('views', "./views")
server.set('view engine', "ejs")

server.use(express.static('public'))
server.use('/images', express.static(path.join(__dirname, 'public', 'images')))
server.use('/css', express.static(path.join(__dirname, 'public', 'styles')))
server.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')))
server.use('/gallery1', express.static(path.join(__dirname, 'public', 'gallery1')))
server.use('/gallery2', express.static(path.join(__dirname, 'public', 'gallery2')))
server.use('/gallery3', express.static(path.join(__dirname, 'public', 'gallery3')))

// auth0 configuration
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL
}

var options = {
    theme: {
        logo: "https://clipartix.com/wp-content/uploads/2016/09/Empty-picture-frame-clipart-clipart-kid-2.png"
    }
}

server.use(auth(config))


// CORS configruation
server.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080")
    res.setHeader("Access-Control-Allow-Methods", 'GET')

    next()
})

// MongoDB Database connections
const client = new MongoClient(process.env.LUKE_ATLAS_URI)
const port = 8080 
var artCollection
var galleryCollection
var userCollection
var gallery

// start server, database connections
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

// ROUTES

// Home page
server.get("/", async (req, res) => {
    try {
        let gals = await galleryCollection.find({}).project({galleryname: 1}).toArray()
        res.render("home.ejs", {galleries: gals})
    } catch (e) {
        res.send(e)
    } 
})

// Galleries page
server.get("/galleries", async (req, res) => {
    try {
        let galleryData = await galleryCollection.find({}).project({galleryname: 1, gallerydesc: 1}).toArray()
        res.render("galleries.ejs", {galData: galleryData})
    } catch(e) {
        res.send(e)
    }
})

// ADMIN ROUTES

// server.get("/login/:page", (req, res) => {
//     const { page } = req.params
//     res.oidc.login({
//         returnTo: page
//     })
// })

server.get("/admin", requiresAuth(), async (req, res) => {
    try {
        var galleryData = await galleryCollection.find({}).toArray()
        // async function to build array of actual art data
        res.render("admin.ejs", {gallery: galleryData})
    } catch (e) {
        res.send(e)
    }
})

server.get("/admin-manage", requiresAuth(), async (req, res) => {
    try {
        var pieces = await artCollection.find({}).project({ title: 1, artistname: 1, filename: 1}).toArray()
        res.render("admin-manage.ejs", {art: pieces})
    } catch (e) {
        res.send(e)
    }
})

server.get("/edit-art=:art_id", requiresAuth(), async (req, res) => {
    try {
        console.log("Requested data for art id: " + req.params.art_id)
        let details = await artCollection.findOne({"_id": ObjectId(req.params.art_id)})
        res.render("edit-art.ejs", {details: details})
        
    } catch (e) {
        res.send(e)
    }
})

server.post("/edit-art=:art_id", requiresAuth(), async (req, res) => {
    try {
        let result = await artCollection.updateOne({"_id": ObjectId(req.params.art_id)}, {$set: req.body})
        res.render("edit-result.ejs", {result: result})
    } catch (e) {
        res.send(e)
    }
})

server.post("/delete-art=:delete_id", requiresAuth(), async (req, res) => {
    try {
        // DELETE IMAGE AS WELL???
        let result = await artCollection.deleteOne({"_id": ObjectId(req.params.delete_id)})
        res.redirect("/admin-manage")
    } catch (e) {
        res.send(e)
    }
})

// These two are for admin's gallery management page
server.get("/manage-gallery=:galleryID/:status?", requiresAuth(), async (req, res) => {
    try {
        galleryContents = await galleryCollection.findOne({"_id": ObjectId(req.params.galleryID)})
        let artData = await artCollection.find({}).project({title: 1, artistname: 1, filename: 1}).toArray()

        // var artData = await artCollection.find({"_id": {"$in": artIDs}}).toArray()
        res.render("manage-gallery.ejs", {
            galID: req.params.galleryID, 
            gallery: galleryContents, 
            art: artData,
            status: req.params.status
        })
        // res.send({
        //     galID: req.params.galleryID, 
        //     gallery: galleryContents, 
        //     art: artData })
    } catch (e) {
        res.send(e)
    }
})

// Process changes to gallery management page
server.post("/manage-gallery=:galleryID", async (req, res) => {
    try {
        let result = await galleryCollection.updateOne(
            {"_id": ObjectId(req.params.galleryID)}, 
            {$set: {
                "displaysIDs": req.body.art_id,
                "gallerydesc": req.body.gallerydesc,
                "galleryname": req.body.galleryname
            }})
        res.redirect("/manage-gallery=" + req.params.galleryID + "/" + result.acknowledged)
    } catch (e) {
        res.send(e)
    }
    
})

// Serves gallery data (as JSON object) to Unity WebRequest, requires CORS middleware
server.get("/unity-grab/gallery=:galleryID", cors(), async (req, res) => {
    try {
        // Pull gallery data
        let galleryData = await galleryCollection.findOne({"_id": ObjectId(req.params.galleryID)})
        
        var artIDArray = galleryData.displaysIDs.map((id) => {
            return ObjectId(id)
        })
        // galleryData.displaysIDs.forEach(piece => {
        //     artIDArray.push(new MongoClient.ObjectID(piece))
        // })
        let artData = await artCollection.find({"_id": {"$in": artIDArray}}).toArray()

        var finalArtArray = []

        galleryData.displaysIDs.forEach(id => {
            finalArtArray.push(artData.find((piece) => {
                return piece["_id"].equals(id)
            }))
        });
        
        res.send({
            galleryInfo: galleryData,
            artInfo: finalArtArray
        })
    } catch (e) {
        res.send(e)
    }
})

server.get("/unity-grab/random", cors(), async (req, res) => {
    try {
        let artFiles = await artCollection.find({}).project({filename: 1}).toArray()
        const randomFile = artFiles[Math.floor(Math.random() * artFiles.length)]

        console.log("Random art requested, sent: " + randomFile.filename)
        res.redirect(`/get-art/${randomFile.filename}`)
    } catch (e) {
        console.log("Couldn't select random art")
        res.send("ERROR")
    }
})

// A way to get JSON data on specific art (not the file itself), not currently used
server.get("/specific-art=:art_id", async (req, res) => {
    try {
        let specificArt = await artCollection.findOne({"_id": ObjectId(req.params.art_id)})
        res.send(specificArt)
    }
    catch (e) {
        res.send(e)
    }
})


// Renders submission form for new art pieces
server.get("/enter-art", requiresAuth(), async (req, res) => {
    res.render("art-entry-form.ejs")
})

// UPLOAD DATA
// Adds form input field data to database (form rendered above)
// Uploads image to Google Cloud Bucket
server.post("/submit-art", mult.single('image'), requiresAuth(), async (req, res) => {
    console.log(req.file)
    if (!req.file) {
        res.status(400).send({message: "We couldn't read a file, please try again."})
        return
    }

    const newName = Date.now() + path.extname(req.file.originalname)
    const blob = bucket.file(newName)
    const blobStream = blob.createWriteStream({
        resumable: false
    })

    console.log(`${bucket.name}/${blob.name}`)

    blobStream.on('finish', res => {})

    blobStream.on('finish', () => {
        const publicUrl = `https://storage.gooleapis.com/${bucket.name}/${blob.name}`
        console.log(publicUrl)
    })

    blobStream.end(req.file.buffer)

    try {
        // console.log(req.body)
        let result = await artCollection.insertOne({
            "artistname": req.body.artistname,
            "title": req.body.title,
            "date": req.body.date,
            "med": req.body.med,
            "statement": req.body.statement,
            "filename": newName})
        // const new_id = result.insertedId
        // let file_add = await artCollection.updateOne(
        //     {"_id": new_id},
        //     { $set: {"filename": req.file.filename}}
        // )
        res.render("entry-result.ejs", {result: result})
    } catch (e) {
        console.log(e)
        res.status(500).send("ERROR")
    }
})

// Pulls image file from google cloud bucket
// To get an image file, use /get-art/filename
server.get("/get-art/:file", cors(), (req, res) => {
    var stream = bucket.file(req.params.file).createReadStream()

    res.writeHead(200, {'Content-Type': ['image/jpg', 'image/png' ]});

    stream.on('data', (data) => {
        res.write(data)
    })

    stream.on('error', (err) => {
        console.log('error reading stream', err);
      });
    
    stream.on('end', () => {
        res.end()
    });
    
}) 

// Sends all art JSON data, not currently used
server.get("/fetch_art", async (req, res, next) => {
    try {
        console.log("Art has been requested!")
        let result = await artCollection.find({}).toArray()
        res.send(result)
    } catch (e) {
        res.status(500).send("OH NO!")
    }
})

// Gets all JSON data for Art collection, renders the phone gallery view
server.get("/all_art", async (req, res) => {
    try {
        console.log("All records have been requested!")
        let result = await artCollection.find({}).toArray()
        res.render("phone-gallery.ejs", {results: result})
    } catch (e) {
        res.status(500).send("FAILURE")
    }
})

// Sends all gallery JSON data
server.get("/gallery-data", async(req, res) => {
    try {
        console.log("Gallery data has been requested!")
        let result = await galleryCollection.find({}).toArray()
        res.send(result)
    } catch (e) {
        res.status(500).send("FAILURE")
    }
})



