# couple - Wordle for two

## Project Overview

couple is a multiplayer word guessing game where two players work together to find a common 5-letter word. Unlike traditional Wordle, players don't know the target word—they discover it by comparing their guesses with each other.

## Game rules

- Two players per game
- Each turn, both players submit a 5-letter word
- Players see color-coded feedback comparing their word with their opponent's word
  - GREEN: Letter exists in both words at the same position
  - YELLOW: Letter exists in both words but at different positions
  - GREY: Letter exists in one word but not in the other
- Game ends when both players submit the same word (win) or after 10 turns (loss)
- Maximum 10 turns per game
- You cant see the other persons submitted words until the end of the game 

## For developers

1) Copy env template:
   - cp .env.example .env
   - Fill EXPO_PUBLIC_FIREBASE_* values from Firebase project settings

2) Start dev server:
   - npm start

## Firebase setup (quick)

- Create a Firebase project
- Enable Realtime Database
- Create a database URL and paste into EXPO_PUBLIC_FIREBASE_DATABASE_URL

## Notes

- MVP stores both players' words in the database (UI hides them).
- If you want true secrecy (players cannot inspect the network to see words):
  - Use Firebase Auth (anonymous)
  - Store each player's word in a private path
  - Use a Cloud Function to compute feedback and write only feedback publicly
