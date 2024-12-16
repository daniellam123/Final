'use strict';

const http = require("http");
const path = require("path");
const express = require("express"); 
const bodyParser = require("body-parser");
const app = express(); 

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })  

const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.p1kqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

const { MongoClient, ServerApiVersion } = require('mongodb');

process.stdin.setEncoding("utf8");

const portNumber = Number(process.argv[2]);

app.set("views", path.resolve(__dirname, "templates"));

app.set("view engine", "ejs");

app.get("/", (request, response) => {     
    response.render("index");
});

app.get("/generate", (request, response) => {
    response.render("generate");
}); 

app.use(bodyParser.urlencoded({extended:false}));

app.post("/generate", async (request, response) => { 
    let {id, rand} =  request.body;
    
    const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '07a9bcbc84mshe08ffc46e1b10cep14aaecjsnef4af9f67c17',
          'x-rapidapi-host': 'quotes88.p.rapidapi.com'
        }
    };      
    let quoteUrl = "";

    if (rand == "on")
        quoteUrl = 'https://quotes88.p.rapidapi.com/random';
    else if (!isNaN(id) && Number(id) > 3)
        quoteUrl = `https://quotes88.p.rapidapi.com/quotes/${id}`;
    else 
        quoteUrl = 'https://quotes88.p.rapidapi.com/random';

    const res = await fetch(quoteUrl, options);
    const json = await res.json()
    let quote = {quote: json.quote, quoteId: json.quoteId}
    response.render("generatedQuote", quote);
        
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(quote);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        response.end();
    }     
});

app.get("/saved", async (request, response) => { 
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const cursor = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .find({});

        const result = await cursor.toArray();
        let quotes = "<ul>";

        for (let i of result) {        
            quotes += `<li>Quote #${i.quoteId}: "${i.quote}"</li>`
        }
        quotes += `</ul>`
        if (quotes != "<ul></ul>")
            response.render("saved", {quotes});   
        else
            response.render("saved", {quotes: "NONE"});   

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        response.end();
    } 
});

app.get("/clearConfirm", async (request, response) => {
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        response.render("clearConfirm", {total: result.deletedCount})
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        response.end();
    }
}); 

app.listen(portNumber);