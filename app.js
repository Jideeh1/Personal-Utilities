const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

console.log(process.env)
const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/convert-mp3", async (req, res) => {
    const videoId = req.body.videoID;
    if(
        videoId === undefined ||
        videoId === "" ||
        videoId === null
    ) {
        return res.render("index", {success : false, message : "Please enter a video ID"});
    } else {
        
    }

})

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})