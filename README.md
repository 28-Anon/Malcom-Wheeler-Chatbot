# Malcolm-Wheeler-Nicholson-Chatbot

An interactive conversation with Major Malcolm Wheeler-Nicholson, founder of the company that became DC Comics. Built with a React frontend and an Express backend.

## How to run

You need [Node.js](https://nodejs.org) version 22 or later.

The server and the client run separately, so open **two terminals** in the project folder.

**Terminal 1: server**
```bash
cd server
npm install
npm run dev
```
The API runs on http://localhost:3000.

**Terminal 2: client**
```bash
cd client
npm install
npm run dev
```
Then open http://localhost:5173 in your browser.

`npm install` is only needed the first time, or after someone adds a new package.

## Running the tests

```bash
cd server
npm test
```

```bash
cd client
npm test
```
