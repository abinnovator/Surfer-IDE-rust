# Surfer IDE
![alt text](image.png)
> Your editor should understand what you're building, not just what you're typing.

Surfer is the IDE built for small studios. Context-aware AI that switches models per framework, a multi-agent task panel that builds entire features autonomously, and lang packs for every domain.(task panel and lang packs comign soon)

---

## How it works

Surfer is built around the idea of adaptability and customization. Every feature is designed to help the editor understand your project — not just your code.

### Indexing

Indexing creates a summary of every file in your project, giving AI agents and the editor deep context about what you're building. It powers several core features:

- **Context-aware AI** — agents have full project context, leading to fewer errors and more relevant suggestions
## Tech stack
This was built in tauri with rust for the backend with vite and typescript for the frontend.
## Shortcuts
- cntrl + s for save
- cntrl + n for a new blank file
- cntrl + t for the terminal
## How to obtain the ai token?
- Go to https://surfer.aaditbhambri.com/token and create an account.
- Go to  https://surfer.aaditbhambri.com/token and copy it
- Then past it in the right sidebar:D
## What makes surfer IDE great?
Its ability to adapt to your project. The indexing feature allows the LLM to know where each file is and what it does. This helps it help you debug better and generate code faster.

The vibrant and cosy theme also makes it seem more welcoming.
In the futurure I will port inbuilt wakatime, custom themes and the task panel:D Till then bear with me.

(If you think this is ai its not. except for the themes part.:))

# Run locally
- Clone the repo ```git clone https://github.com/abinnovator/Surfer-IDE-rust```
- cd into the folder 
- run ```npm install``` to install the dependenicies
- To boot up the app then run ```npm run tauri dev```
 # Download steps
- Download the newest .dmg
- Install the app
- It will say that the app is damaged. Run - xattr -cr /Applications/surfer-ide.app
