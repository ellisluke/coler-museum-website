require('dotenv').config()
const { MongoClient, ObjectID, MongoUnexpectedServerResponseError, ObjectId } = require("mongodb")
const express = require("express")
const BodyParser = require('body-parser')
const { response } = require("express")
const cors = require('cors')
const path = require('path')
const { appendFile } = require("fs")

// const controller = require("./controller/file.controller.js")


const multer = require("multer")
const maxFile = 5 * 1024 * 1024;
const { Storage } = require('@google-cloud/storage')

const storage = new Storage({keyFilename: "google-cloud-key.json"})
const bucket = storage.bucket(process.env.BUCKET_NAME)

// console.log(bucket)

const mult = multer({ 
    storage: multer.memoryStorage(),
    limits: {fileSize: maxFile}
})
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "public/images/uploads")
//     },
//     filename: (req, file, cb) => {
//         console.log(file)
//         cb(null, Date.now() + path.extname(file.originalname))
//     }
// })


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
server.use('/gallery1', express.static(path.join(__dirname, 'public', 'gallery1')))
server.use('/gallery2', express.static(path.join(__dirname, 'public', 'gallery2')))

server.use(session({
    secret: "aqu457mcf06$%^&@",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 6000000 }
}))

// CORS
server.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
    res.setHeader("Access-Control-Allow-Methods", 'GET')

    next()
})

// server.use(cors({
//     origin: '*',
//     methods: ['GET']
// }))

const client = new MongoClient(process.env.LUKE_ATLAS_URI)
const port = 8080 
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
    try {
        let gals = await galleryCollection.find({}).project({galleryname: 1}).toArray()
        res.render("home.ejs", {galleries: gals})
    } catch (e) {
        res.send(e)
    }
    
    
})

server.get("/galleries", async (req, res) => {
    try {
        let galleryData = await galleryCollection.find({}).project({galleryname: 1}).toArray()
        res.render("galleries.ejs", {galData: galleryData})
    } catch(e) {
        res.send(e)
    }
    
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
    // if (!req.session.admin) {
    //     res.redirect('/')
    // }
    // else {
        try {
            var galleryData = await galleryCollection.find({}).toArray()
            // async function to build array of actual art data
            res.render("admin.ejs", {gallery: galleryData})
        } catch (e) {
            res.send(e)
        } 
    // } 
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
        res.render("edit-result.ejs", {result: result})
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
        galleryContents = await galleryCollection.findOne({"_id": ObjectId(req.params.galleryID)})
        let artData = await artCollection.find({}).project({title: 1, artistname: 1, filename: 1}).toArray()

        // var artData = await artCollection.find({"_id": {"$in": artIDs}}).toArray()
        res.render("manage-gallery.ejs", {
            galID: req.params.galleryID, 
            gallery: galleryContents, 
            art: artData })
        // res.send({
        //     galID: req.params.galleryID, 
        //     gallery: galleryContents, 
        //     art: artData })
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

server.get("/unity-grab/image=:imageName", cors(), (req, res, next) => {
    var options = {
        root: path.join(__dirname, 'public', 'images', 'uploads'),
        dotfiles: 'deny'
    }
    
    res.sendFile(req.params.imageName, options, (e) => {
        if (e) {
            next(e)
        } else {
            console.log("Sent image: ", req.params.imageName)
        }
    })
})

server.get("/specific-art=:art_id", async (req, res) => {
    try {
        let specificArt = await artCollection.findOne({"_id": ObjectId(req.params.art_id)})
        res.send(specificArt)
    }
    catch (e) {
        res.send(e)
    }
    
})

// UPLOAD DATA
// server.post("/submit-art", upload.single("image"), async (req, res) => {
//     try {
//         console.log(req.body)
//         let result = await artCollection.insertOne(req.body)
//         const new_id = result.insertedId
//         let file_add = await artCollection.updateOne(
//             {"_id": new_id},
//             { $set: {"filename": req.file.filename}}
//         )
//         res.render("entry-result.ejs", {result: result, file_result: file_add})
//     } catch (e) {
//         console.log(e)
//         res.status(500).send("ERROR")
//     }
// })

// UPLOAD DATA
// Adds form input field data to database
// Uploads image to Google Cloud Bucket
server.post("/submit-art", mult.single('image'), async (req, res) => {
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

// To get an image file, use /get-art/filename
server.get("/get-art/:file", (req, res) => {
    var stream = bucket.file(req.params.file).createReadStream()

    res.writeHead(200, {'Content-Type': ['image/jpg', 'image/png' ]});

    stream.on('data', (data) => {
        res.write(data)
    })

    stream.on('error', (err) => {
        console.log('error reading stream', err);
      });
    
    stream.on('end', () => {
        console.log("finished!")
        res.end()
    });
    
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
    // if (!req.session.admin) {
    //     res.redirect('/')
    // }
    res.render("art-entry-form.ejs")
})


