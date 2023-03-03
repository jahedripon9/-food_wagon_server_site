const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");




// Midleware

app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piqtj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {

    try {
        await client.connect();
        const database = client.db('FoodWagon');
        const fooditemsCollection = database.collection('foodItems');
        const usersCollection = database.collection('users');

        // GET API
        app.get('/fooditems', async (req, res) => {
            const cursor = fooditemsCollection.find({});
            const fooditems = await cursor.toArray();
            res.send(fooditems);
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        // GET SINGLE Item
        app.get('/fooditems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const fooditem = await fooditemsCollection.findOne(query);
            res.json(fooditem)
        })

        // POST API


        app.post('/fooditems', async (req, res) => {
            const fooditem = req.body;

            console.log('Hit the post api', fooditem)
            const result = await fooditemsCollection.insertOne(fooditem);
            console.log(result);
            res.json(result);
        })

        // DELETE API

        app.delete('/fooditems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await fooditemsCollection.deleteOne(query);
            res.json(result);

        })
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);

                }
            }
            else {
                res.status(403).json({ message: 'You do not have access to make Admin' })
            }
        })

    }
    finally {
        // await client.close();
    }

}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Food Wagon server is running');

})
app.listen(port, () => {
    console.log('server running at port', port)
})