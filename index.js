//Twilio Auth

var accountSid = 'AC2731625cd4d1b8355cfb34879ae76849';
var authToken = 'be5775af06ad2f718b2c3d286866b8ff';   // Your Auth Token from www.twilio.com/console


var twilioPackage = require('twilio');
var twilio = new twilioPackage(accountSid, authToken);

// FIREBASE 

// The Firebase Cloud Functions
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Firebase db setup
var db = admin.firestore();

// Specify collections within db
var users = db.collection('Users');
var jobs = db.collection('Jobs');

// DB listener for job creation 
// find users with matching job types 
// text these users 

// This is the Firestore listener

exports.newJob = functions.firestore
    .document('Jobs/{jobId}')
    .onCreate((job, context) => {
    
    // New data added to db
    const data = job.data() 
    
    // New unique jobId created randomly when new db entry is created
    const jobId = context.params.jobId;

    // iterate users 
    // find job type matches
    // return array of user's phone numbers
    
    return findJobTypeMatches(data)
    
    // add candidates to job db
    // text candidates 
    
    .then( function(phoneNumbers) {

        return storeAndTextJobCandidates(jobId, phoneNumbers, data)

    })
    
    // success or failure determination
    
    .then( function(response) {
        console.log("review added successfully", response)
        return "success"

    })
    .catch( function(err) {
        console.log("bad review request", err)
        return "failure"
    })

});

// find users with matching job types 

async function findJobTypeMatches(data) {

    // variables from new job posting 
    
    const jobType = data.type;
    const numWorkers = data.reqWorkers;
    
    // get users 
    
    const userCollection = await users.get()
    
    // find job type matches and return array of phone numbers
    
    var matches = []
    
    userCollection.forEach( user => { 
        
        // if user has job type matching specified job type 
        
        if (user.data().jobTypes.includes(jobType)) {
            
            // push user phone number to matches array 
            
            matches.push(user.data().phone)
        }
        
    });
    
    // return user matches array
        
    return matches
        
}

// Store phone numbers of job type matches and then text them description

async function storeAndTextJobCandidates(jobId, phoneNumbers, data) {
    
    // update job db with phone numbers of matches
    
    await jobs.doc(jobId).update({'candidates':phoneNumbers})
    
    // text matches 

    await text(candidates, data)
    
}

// TEXT ARRAY OF USERS 

async function text(numbers, data) {
    
    // return an array of promises made up of twilio client requests 

    await Promise.all(textLoop(numbers, data.description));
    
}

// return promise when phone number is texted 

function textLoop(numbers, description) {
    
    return numbers.map( (number) => {
        
        return twilio.messages.create({
                body: description,  // job description
                to: number,  // Text this number
                from: '+12138175993' // From a valid Twilio number
        }) 
        .then((message) => console.log(message.sid));
    })
    
}