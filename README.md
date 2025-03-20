# Website Name - Volunteer Platform (server side)

A website for searching volunteers also become volunteers for any events, also create events online for informing others about any events and posting any query if anyone needs any volunteer.


# Live Link

[website/link](https://gleaming-sundae-f83b38.netlify.app/)

# Technology Used

- MongoDB
- React
- NodeJS
- ExpressJS
- JWT
- Axios
- Tailwind CSS
- React-Icon
- React-Toastify
- Vercel (server hosting)
- Netlify (website hosting)

# Features

- Event creation, owner of the event is restricted from joining their own events
- Posting any help, owner of the post is restricted from replying to their own posts
- Any user cannot join any event twice
- An understandable user profile, where every activity of the user is represented
- User profile as a user dashboard
- Posts differentiations by urgent, low, medium
- Filter option by date, category, location for events
- JWT token implementation for authentication
- User registration process by JWT

# Database Schema

## Users Collection

```json
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "password": String (hashed),
  
}
```

## Events Collection

```json
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "date": String (YYYY-MM-DD),
  "time": String (HH:MM),
  "category": String,
  "location": String,
  "creatorId": ObjectId (user reference),
  "createdAt": ISODate
}
```

## AddEvent Collection (User Participation)

```json
{
  "_id": ObjectId,
  "attenderId": ObjectId (user reference),
  "eventCreatorId": String (user reference),
  "eventId": String (event reference),
  "joinedAt": ISODate
}
```

## Posts Collection (Help Requests)

```json
{
  "_id": ObjectId,
  "about": String,
  "category": String,
  "location": String,
  "urgency": String ("urgent", "medium", "low"),
  "creatorId": ObjectId (user reference),
  "createdAt": ISODate
}
```

## Messages Collection 

```json
{
  "_id": ObjectId,
  "postId": ObjectId(post reference),
  "senderId": ObjectId (user reference),
  "message": String,
  "creatorId": String (user reference),
  "createdAt": ISODate
}
```

# Setup Instructions

- Clone the repo
- Navigate to the project directory: `cd path/to/your/repo`
- Install dependencies: `npm install`
- Set up environment variables:
  - Copy `.env.example` to `.env`: `cp .env.example .env`
- Build the Project: `npm run build`
- Start the application: `npm start`
- Run tests: `npm test`



# Running the project (Locally)

- Remove the Vercel link (server hosting) from the client-side code.
- Replace it with your local server link.
- Start the server:

```bash
nodemon index.js
```

- Start the client-side:

```bash
npm run dev
```

# (In Production)

## Server (Vercel)

1. Create an account on Vercel (if you don't have one).
2. Deploy the server:

```bash
vercel .
vercel --prod
```

3. Replace the local server link with the Vercel server link in the client-side code.

## Client (Netlify)

1. Build the client-side:

```bash
npm run build
```

2. Upload the `dist` folder to Netlify.

If the `dist` folder is missing, rebuild using `npm run build`.

After deployment, you will receive a Netlify link for your hosted site.
