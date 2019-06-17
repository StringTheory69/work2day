//Twilio Auth

var accountSid = 'AC2731625cd4d1b8355cfb34879ae76849';
var authToken = 'be5775af06ad2f718b2c3d286866b8ff';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

// FIREBASE 
// The Firebase Cloud Functions
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();


// Firebase db setup
var db = admin.firestore();

// documents in db
var users = db.collection('Users');
var jobs = db.collection('Jobs');

// DB listener for job creation 
// find users with matching job types 
// text these users 

exports.newJob = functions.firestore
    .document('Jobs/{jobId}')
    .onCreate((job, context) => {
    
    const data = job.data() 
    const jobId = context.params.jobId;

    // find candidate matches
    
    return findJobTypeMatches(data)
    
    // add candidates to job db
    // text candidates 
    
    .then( function(candidates) {
        console.log("FINAL CANDIDATES", candidates)
        return storeAndTextJobCandidates(jobId, candidates, data)

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
    
    // how many extra workers should be added to ensure sufficient choices in next step 
    
    const workersMultiplier = 2
    var candidates = [];
    var remainder = 0 

    // variables from new job posting 
    
    const jobType = data.jobType;
    const numWorkers = data.numWorkers * workersMultiplier;
    
    // get users 
    
    const userCollection = await users.get()
    
    // find job type matches
    
    var matches = []
    
    userCollection.forEach( user => { 
        console.log(user.data().jobTypes)
        if (user.data().jobTypes.includes(jobType)) {
            matches.push(user.data().phone)
        }});
    
    console.log(matches)
 
//    if (matches.length >= numWorkers) {
//        matches = matches.splice(numWorkers, (matches.length - numWorkers))
//    } 
    
    return matches
        
}

async function storeAndTextJobCandidates(jobId, candidates, data) {
    
    await jobs.doc(jobId).update({'candidates':candidates})
    console.log("DATA", data)
    await text(candidates, data)
}

// needed to do this because of scope issues 

function userLoop(userIds) {
    return userIds.map( (userId) => {
        
        return users.doc(userId).get()

    })
}

async function text(numbers, data) {
    
//    const users = await Promise.all(userLoop(candidates));
//    
//    console.log(users);
//
//    const numbers = users.map( (user) => {
//        return user.data().phone
//    })
    
    console.log(numbers);
    console.log("data.description", data.description)

    await Promise.all(textLoop(numbers, data.description));
    
}

function textLoop(numbers, body) {
    
    console.log("BODY", body)
    return numbers.map( (number) => {
        
        return client.messages.create({
                body: body,
                to: number,  // Text this number
                from: '+12138175993' // From a valid Twilio number
        }) 
        .then((message) => console.log(message.sid));
    })
    
}

function checkRemainder(remainder, ratingCategory, jobType) {
    
    if (remainder > 0) {
        
        // find more matches 
        
        const matches = findJobTypeMatches(ratingCategory, jobType);
        
        // calculate remaining matches to be made or excess matches to be removed
        
        const difference = matches.length - remainder
        
        // remove excess matches or return remainder of matches needed 
        
        // this remainder being zero business is ugly - REFACTOR 
        return differenceConditional(matches, difference, 0)
        
    } else {
        
        // remainder is equal to 0 and so is difference 
        // this could be more elegant - REFACTOR 
        
        return differenceConditional([], 0, 0) 
        
    }
}

function differenceConditional(matches, difference, remainder) {
    
    if (difference !== 0) {
        
        if (difference > 0) {
            
            // remove difference number of elements randomly from unratedDifference array 
            
            for (i = 1; i <= difference; i++) {
                matches.splice(Math.floor(Math.random() * (difference - 1)), 1) 
            }
                        
        } else {
            
            // add difference to star5Difference then get difference from star rating 4
            
            remainder += Math.abs(difference)
    
        }
                
    }
    
    return {'matches':matches, 'remainder':remainder}
    
}
