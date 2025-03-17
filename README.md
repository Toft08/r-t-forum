# Real-Time Forum

## Overview

This project is an improved version of a previous forum, incorporating real-time features such as private messaging and WebSockets for seamless user interactions.

## Technologies Used
* SQLite: Database for storing user data, posts, and messages.

* Golang: Backend logic and WebSocket handling.

* JavaScript: Frontend event handling and WebSocket client.

* HTML & CSS: UI structure and styling.

# Features

# Authentication

* User registration with the following fields:

    * Nickname

    * Age

    * Gender

    * First Name

    * Last Name

    * Email

    * Password

* Login using either nickname or email with password.

* Logout from any page.

# Posts and Comments

* Create posts with categories.

* Comment on posts.

* View posts in a feed.

* View comments by clicking on a post.

# Private Messages

* Real-time chat system using WebSockets.

* Online/offline user status.

* Conversations sorted by last message sent (or alphabetically if no messages exist).

* Persistent chat history.

* Infinite scroll for loading messages in batches of 10.

* Messages display timestamp and sender information.

* Instant message delivery without page refresh.

# Development Guidelines

* Single Page Application (SPA): Use JavaScript to manage page navigation.

* Allowed Packages:

    * gorilla/websocket

    * sqlite3

    * bcrypt

    * gofrs/uuid or google/uuid

* Prohibited: No frontend libraries/frameworks (React, Angular, Vue, etc.).

# Learning Outcomes

* HTML, HTTP, Sessions, and Cookies

* Backend and Frontend Interaction

* DOM Manipulation

* Go Routines and Channels

* WebSockets in Go and JavaScript

* SQL Database Management