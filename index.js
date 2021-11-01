const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
// jahedripon9
// Xi70pbAFIFuZkiMN

// Midleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piqtj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){

    try{
        await client.connect();
        const database = client.db('FoodWagon');
            const fooditemsCollection = database.collection('foodItems');

            // GET API
            app.get('/fooditems', async(req, res)=>{
                const cursor = fooditemsCollection.find({});
                const fooditems = await cursor.toArray();
                res.send(fooditems);
            })
            // GET SINGLE Item
            app.get('/fooditems/:id', async(req, res)=>{
                const id = req.params.id;
                const query = {_id: ObjectId(id)};
                const fooditem = await fooditemsCollection.findOne(query);
                res.json(fooditem)
            })

            // POST API
            

            app.post('/fooditems', async(req, res)=>{
                const fooditem = req.body;

               console.log('Hit the post api', fooditem)
                const result = await fooditemsCollection.insertOne(fooditem);
                console.log(result);
                res.json(result);
            })

             // DELETE API

             app.delete('/fooditems/:id', async(req, res )=>{
                const id = req.params.id;
                const query = {_id:ObjectId(id)};
                const result = await fooditemsCollection.deleteOne(query);
                res.json(result);
                
            })

    }
    finally{
        // await client.close();
    }

}

run().catch(console.dir)

app.get('/', (req, res)=>{
    res.send('Food Wagon server is running');
  
})
app.listen(port, ()=>{
    console.log('server running at port', port)
})