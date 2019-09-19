# work2day

![Work2Day Logo](https://github.com/jsmellz/work2day/blob/master/Group%402x.png)

work2day cloud endpoint

Work2day was a project a friend and fooled around with for about a month but ended up leaving on the drawing board. It was intended as a web app built in react with abackend using Firebase. I was in charge of the backend and this was one of my first passes at it. This uses Firebase and Twilio sdks. 

There is one main function called newJob which...

1. listens for new database entries (job creation)
2. finds users with matching job types in database and returns an array of their phone numbers
3. uses Twilio to text them the job description
