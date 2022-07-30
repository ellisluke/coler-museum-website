# The Coler Nursing Facility Virtual Museum

## Authors

Luke Ellis, Marie Williams, James Koga, Bil Leon

## Project Description

Coler Nursing Facility is a state-run, high-skilled nursing center and care home located on the northern end of Roosevelt Island in New York City. This project was initiated and completed as part of Cornell University's and Cornell Tech's Milstein Program in Technology and Humanity.

## Outline of Deliverables

The client approached Cornell Tech with a simply defined problem: Their working spaces were accumulating artwork done by patients, and they were looking for a solution to digitize and display the art publicly. Upon visiting the hospital and seeing the high level of patient art, we created this list of deliverables we would give to the client within the timeframe (July 5th July 25th).

- An updatable database and cloud storage solution in which the hospital could upload existing and future works of art.
- A virtual 3D art gallery in which users can move and view patient artwork.
- A comprehensive backend with that hospital administrators could use to
  - upload new artworks into the database
  - manage the art metadata currently in the database
  - change (curate) the artwork that is on display in the virtual galleries
- A detailed set of instructions that will show the hospital administrators how to keep the project running on their own

## Open-Source Statement and Pre-requisites

License: INSERT LICENSE HERE

We hope to make this project truly open-source. We'd like to help other hospitals set up their own virtual galleries using patient artwork, so we've documented our work to help others understand how to deploy the project.

If you'd like to deploy this website and you have any questions or requests, please reach out to us at EMAIL.

Additionally, if you run into any issues regarding Node dependencies that have been updated since this project was created, please notify us at EMAIL.

If you'd like to edit the Unity Projects for your own purposes, the first two galleries can be found at

- Git repository 1
- Git repository 2

We cannot release the contents of the third gallery due to some of the models used requiring a purchased license. The model of the city can be found HERE.

### Pre-requisites for Individual Deployment

- A familiarity with web development (HTML and CSS in particular) is highly recommended. This will help you to more easily customize the pages to be specific to your art program.
- A budget. Depending upon the scale at which you intend to deploy this project, there may be additional costs for web hosting and cloud storage.
- A willingness to learn. Most of the back-end is in place for you to use, but there are some changes you may need to make to fit your circumstances. We try to provide you with the knowledge to make such changes, but things may break and you must be comfortable with taking risks and troubleshooting.

## Privacy & Intellectual Property Statment

The last and **most important** thing to consider before proceeding with this project is the sensitivity of the data you're using! If you use this for a hospital application especially, please check with the hospital's legal team to figure out what data must be protected and where consent is needed. Given that this is an open-source project (i.e. all the code is available online), we highly recommend not storing any sensitive information in this database.

**This project, or any members or organizations who have contributed to it, are not liable for any such breaches of privacy, security, or loss of information. Once you clone this project, YOU (the user) are fully liable for any damages it may cause.**

Personally, my recommendation is don't store any information in the database that isn't already publicly accessible on the website. Do not enter any information that you have not already received consent to share. If you're unsure, ask someone who knows.

## Outline of Technologies Used

### Front-end

- EJS templating language (based on HTML)
- CSS
- JavaScript, JQuery

### Node.JS Back-end Dependencies

- Express, a simple method of routing in Node.JS
- EJS, a dynamic template engine much like PHP
- BCrypt, for hashing passwords
- CORS
- MongoDB, for CRUD operations with MongoDB cloud cluster
- Multer, for handling file uploads
- Dotenv, for keeping keys and codes safe (keys for things like databases that shouldn't be published on GitHub for security reasons)

Some additional developing dependencies were used, see package.json "dependencies" section for full details.

### Database

- MongoDB Cloud Cluster
- Google Cloud Storage Bucket

### 3D Modeling

- Unity Engine
- Blender
- Pre-fabricated resources from poly.pizza, sketchfab.com, ONE MORE

### Deployment

- Google Cloud App Engine
- Google Cloud Storage Bucket

## Outline of File Structure

Many issues I encountered throughout this project have been related to file structure. I highly recommend not overlooking this section.

- /node modules
  - Many, many node packages that *should not be edited*
- /public - **all these folders are served statically**
  - /gallery1 - contains files for the first gallery's unity builds
  - /gallery2 - contains files for the second gallery's unity builds
  - /gallery3 - contains files for the third gallery's unity builds
  - /images - contains static images on the website (not patient artwork) and some cat/dog images used during testing
  - /scripts - contains javascript that is used for front-end (not much in this project)
  - /styles - contains CSS files that are used in various places on the website
- /views - **all these files are rendered by index.js**
  - Many files that are every page on this website. All contain at least one dynamic element (data that is passed in from **index.js**)
- .env - This file is not visible in GitHub, it contains important configuration keys that should not be shared publicly. See "Setting up this Project for Development" for more details on creating this file for yourself.
- .gitignore - This file tells GitHub which files should not be included in the GitHub repository. See "Setting up this Project for Development" for more details on creating this file for yourself.
- app.yaml - This file contains configuration data for deploying the website to Google Cloud.
- index.js - This file is where all the routes are served and database queries are made. This is the meat of the project. It will be explained in its own section.
- JSONTemplates.json - This file contains the database record structures as JSON objects. I did this to help myself in the early phases of database planning and to hurry things along when I was making records by hand.
- package-lock.json, package.json - These two files contain information on the dependencies and other metadata of the Node.JS project.

## Routes

### GET Methods

| **Route** | **Template Rendered** | **Data Sent** | **Who Uses It?** |
| --------- | --------------------- | ------------- | --------------------- |
| / |  home.ejs | Active gallery titles | Any user |
| /galleries | galleries.ejs | Active gallery titles and descriptions | Any user |
| /login | login.ejs | Sends no data | Any user |
| /logout | Redirects to / | Sends no data | Administrator Only |
| /admin | admin.ejs | Sends no data | Administrator Only |
| /admin-manage | admin-manage.ejs | Sends ID, title, artist name, and filename of every artwork | Administrator Only |
| /enter-art | art-entry-form.ejs | Sends no data | Administrator Only |
| /edit-art=:art_id | edit-art.ejs | Sends all data related to artwork with ID: art_id | Administrator Only |
| /manage-gallery=:galleryID/:status? | manage-gallery.ejs | Sends all data for gallery with ID: galleryID, sends all art titles, artist names, and filenames. Optional query parameter ":status?" is only true when the form has successfully updated | Administrator Only |
| /get-art/:file | Image File | Sends a file from Google Cloud Bucket | Administrator, Unity |
| /unity-grab/gallery=:galleryID | Strictly JSON Response | Sends gallery data (title, description) for gallery with ID: galleryID, and it sends all art data for pieces in the gallery | Unity |
| /unity-grab/random | Redirects to /get-art/ with random filename | No data sent | Unity |
| /specific-art=:art_id | Strictly JSON Response | Sends all data for art with ID: art_id | Any user |
| /fetch_art | Strictly JSON Response | Sends all art data | Any user |
| /all_art | phone-gallery.ejs | Sends all art data | Any user |
| / gallery_data | Strictly JSON Response | Sends all gallery data | Any user |

### POST Methods

| **Route** | **Data Changed** | **Template Rendered** | **Who Uses It?** |
| --------- | ---------------- | --------------------- | ---------------- |

## Database Structures

## A Note on Javascript MongoDB Queries

Thankfully, MongoDB has fantastic documentation that can be found HERE. This project does use at least one of each CRUD (Create, Read, Update, Delete) operation, so I recommend you give it a read. "Read" is the most frequently used of the four, and it follows the following format in Node.JS.

```js
let data = client.db("coler-museum").collection("artwork").find({parameters for desired data}).project({names of desired fields}).toArray()
```

Since we set our collections as variables in this project, however, we can simply call

```js
let data = collectionVariable.find({parameters for desired data}).project({names of desired fields}).toArray()
```

There are, of course, many variations to this to specify exactly which data you'd like to pull from the database. It is good practice to use some of these tools so you aren't wasting resources finding data you aren't going to use. This project is fairly optimized on this front, but there may be a few loose pieces of data that are no longer being referenced.

## **index.js** Explainer

Index.js essentially handles all passing of data between the website, database, and Unity builds. It is the most central piece of this project. Here, I outline some code structures used frequently in this file to clarify what exactly this file is doing.

```js
const express = require("express")
```

At the top of the file, you see many lines that look like this. Essentially, we are setting the Node dependencies to variables, and this will let us call functions that those dependencies provide.

```js
const server = express()
```

This is where I use the ```express``` dependency that I just declared to say that ```server``` will be the name of our app. You will see ```server``` referenced many times after this.

```js
server.set('views', "./views")
server.set('view engine', "ejs")
```

Here, I am telling Express where my "views" are located. In this case, they are set in the folder called views which is contained in the root directory. I also tell Express that the "view engine" being used is EJS, a dependency I mentioned earlier.

```js
server.use(express.static('public'))
server.use('/images', express.static(path.join(__dirname, 'public', 'images')))
...
server.use('/gallery3', express.static(path.join(__dirname, 'public', 'gallery3')))
```

These lines are using express.static to set *static* folders. Static folders contain files that do not ever change. The first argument is where the route at which these files can be accessed. So, if I want to see an image called "cat.jpg" that's in the static images folder, I'd visit ```www.website.com/images/cat.jpg```. This also means the WebGL builds of the Unity galleries (which are considered static) can be viewed at ```www.website.com/gallery1```.

```js
const client = new MongoClient(process.env.LUKE_ATLAS_URI)
```

Here, I prepare to connect to the Database client using the MongoClient dependency I declared near the top. Note that ```process.env.LUKE_ATLAS_URI``` accesses a variable in the ".env" file you will have to create when you set this project up.

```js
const port = 8080
...
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
```

This is an important chunk of code. Calling ```server.listen``` means we are starting our server and it can now respond to incoming requests at port 8080. Part of this process is connecting to the different MongoDB collections (which is like a table within a database). Declaring ```artCollection```, ```galleryCollection```, and ```userCollection``` here will reduce the amount of code for database actions down the road.

Now that we've made it through all the configuration (the boring stuff), we get to the fun part: handling requests.

```js
server.get("/galleries", async (req, res) => {
    try {
        let galleryData = await galleryCollection.find({}).project({galleryname: 1, gallerydesc: 1}).toArray()
        res.render("galleries.ejs", {galData: galleryData})
    } catch(e) {
        res.send(e)
    }
})
```

This is what our average GET request looks like throughout this process. Note: this is a GET request because it simply responds to the request for data. We would use a POST request if the request was trying to edit the database in any way. I will now break this down further.

```js
server.get("/galleries", (req, res) => {
  // We do stuff
})
```

This means when the user visits `www.website.com/galleries`, we will respond in the following way. The code to the right of the "/galleries" is an anonymous function (it has no specific name as it's only called here). This anonymous function has two parameters: `req` (standing for request) and `res` (standing for response). `req` is an object that contains any additional information about the request coming from the user. Then, we use `res` to respond in a variety of ways. This project mostly uses `res.render("some-template.ejs", {data we want to put into the template})`.

But you'll notice that many of our routes like these use this funny word `async`. `async` makes that anonymous function I was talking about "asynchronous." An asynchronous function has the ability to wait for things (in our case, wait for data from the database). Since our data is stored somewhere else (in the cloud), it may take a little bit of time for us to receive the data we want, and we don't want to move on without it. So, every time a database query is made, it has to follow a similar structure as this:

```js
server.get("/route", async (req, res) => {
  try {
    let data = await // insert database query
    res.send(data) // send our data to the route as a strictly JSON response
  } catch (e) {
    res.send(e) // If we encounter an error, send 
  }
})
```

The `await` keyword is important because it pauses the rest of our code as the database query takes some time to return a value. If we didn't use `await`, the data we send will likely be empty!
We also need to use a try-catch block when working with databases, because we don't want the whole website to come crashing down should the database return errant data (which it can do for a variety of reasons).

```js
server.get("/specific-art=:art_id", async (req, res) => {
  console.log(req.params.art_id)
})
```

Query string parameters are an important part of our project, as it gives us an easy way to access specific pieces of art or galleries. Have you ever noticed that when you Google something, the URL in your search bar goes from `www.google.com` to `www.google.com/something/something/more/weirdStuff/randomness`? Well, it's not all random. These are a bunch of query string parameters that pass data to the server via URL. Express has an easy way to use query string parameters using a colon `:`. You'll notice that I've set up a query string parameter here called art_id by putting a colon in front of it. To separate query string parameters, use a `/`. To reference a query string parameter, their values can be found at `req.params.NAME`.

## Setting up this Project for Development

This means making your project accessible at `localhost:8080`

## Setting up this Project for Deployment

This means deploying your project to Google Cloud and making it generally accessible on the internet.
**Please complete the last section before completing this one.**
