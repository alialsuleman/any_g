import dotenv from 'dotenv'
dotenv.config();
import express from 'express'

import { connectDB } from './db/connect'
import { notFound } from './middleware/not-found'
import { errorHandlerMiddleware } from './middleware/error-handler'
import authRoute from './routes/user.route'
import buyRoters from './routes/buy.route'

import exerciseRoute from './routes/Exercise.route'
import fitnessRoters from './routes/FitnessProgram.route'





import cors from 'cors';
import { verify } from './middleware/verify-token'
import { MONGO_URI } from '../env'
import path from 'path'


const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());


const port = process.env.PORT || 3000;


// middleware

app.use(express.static('public')); //http://localhost:3000/uploads/1754137588861-750925608.jpeg
// Routes
//app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/api/user', authRoute);
app.use('/api/exercise', exerciseRoute)
app.use('/api/fitness', fitnessRoters)
app.use('/api/buy', buyRoters)

app.use(notFound)
app.use(errorHandlerMiddleware)

console.log(MONGO_URI);
const start = async () => {
    try {
        await connectDB(MONGO_URI as string);
        app.listen(port, () => console.log(`Server listening on port ${port}...`))
    } catch (err) {
        console.log(err);
    }
}

start()