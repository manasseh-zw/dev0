![Viber App Demo](https://i.ibb.co/BK5Qw77W/landing.png)

![Viber App Demo](https://i.ibb.co/qLHPtWdH/Screenshot-2025-12-31-at-22-28-22.png)

## Inspiration

The inspiration came from multiple sources. I wanted to understand how modern app builders work under the hood. I recognized that voice interfaces offer something profound, better expression of ideas. 

When you speak conversationally instead of writing prompts, you can think out loud, refine concepts naturally, and get immediate feedback. Plus, there's the accessibility angle. Voice-first development could open software creation to people who can't or don't want to type.

When Google released their Gemini 3 series with exceptional UI generation capabilities and ElevenLabs introduced sophisticated tool-calling for voice agents, the pieces aligned. This was the perfect storm to build something ambitious.

## What it does

Viber is a conversational app builder. You talk to it, and it builds React applications for you.

The voice agent isn't just transcribing commands. You can discuss your ideas, ask for suggestions, iterate on concepts, and get advice, all through low-latency, natural conversation.

Viber understands project structure. It breaks down your request into proper components, selects appropriate libraries, writes clean TypeScript, and organizes everything into a maintainable codebase.

Within seconds, your app spins up in a real development environment with hot module replacement. You see changes applied instantly as they're generated.

Simple voice commands trigger intelligent edits that identify exactly which files need modification. No regenerating entire codebases, just surgical, precise changes.

![Architecture Overview](https://i.ibb.co/8g53vxvk/architecture.png)


## How I built it

Viber runs on a carefully chosen stack optimized for speed and reliability.

ElevenLabs Conversational AI handles speech-to-intent with advanced tool-calling capabilities. I implemented custom client-side tools that let the agent trigger builds and control the UI directly, creating true integration between voice and action.

The system uses different models strategically. The Pro variant handles complex initial builds, while Flash provides rapid intent analysis during edits.

A high-performance execution environment using Bun runtime (three times faster than Node) delivers instant feedback through hot module replacement.

I built a specialized Unsplash proxy where the AI describes images it wants, and the system fetches and serves them directly into the live preview. Images become part of the generated code seamlessly.

The system uses carefully engineered prompts that enforce component-based architecture. This makes the difference between a monolithic mess and clean, editable code.

## Challenges I ran into

My initial approach had the voice agent hitting API endpoints disconnected from the client UI. The agent would trigger a build, but the user interface had no idea anything was happening. I had to redesign the entire system around client-side tools to keep everything perfectly synchronized.

I needed updates flowing from the generation process back to the voice agent so it could naturally inform the user. The solution was ingenious. I annotated system updates with special headers and injected them into the voice agent's input stream. Through prompting, the agent learned to recognize these as status updates and speak them naturally.

My first sandbox provider was too slow. Code changes took too long to appear, killing the experience. Switching providers and optimizing the entire initialization process made a massive difference.

Early versions would regenerate entire codebases for small changes. I implemented intent recognition that analyzes edit requests and identifies exactly which files need context. This reduced token usage dramatically and made edits near-instantaneous.

I spent significant time fighting against the generic aesthetic that plagues AI tools. Every rounded border became square. Every color was deliberate. The font pairing took hours to get right. Details matter when you want something to feel wonderful.

## Accomplishments that I'm proud of

Getting the entire system working end-to-end feels magical. Speaking a concept and watching a fully functional React app materialize, complete with proper component structure, working routing, and tasteful design, never gets old.

The brand identity stands out. Square borders instead of the ubiquitous rounded ones. A vibrant orange theme with pure white backgrounds that feel spacious. 

The landing page features Rick Rubin, the godfather of vibe coding himself, as a playful nod to the creative philosophy behind this project.

The technical innovations are equally satisfying. The incremental XML parser that updates the UI as tokens stream in. The message-passing system using annotated input streams. The component-enforcing prompt engineering that makes surgical edits possible. These weren't features I copied, they were problems I had to solve creatively.

## What I learned

Building a code agent taught me that prompt engineering is very important. By carefully structuring the AI's output format and mandating component separation, I made it possible to edit apps surgically rather than regenerating everything.

I learned that voice interfaces require different thinking than chat interfaces. Latency matters more. Feedback loops matter more. The agent needs to feel responsive and aware, not just accurate.

I discovered that user experience decisions, like when to switch between code view and preview, or how long to wait before refreshing the sandbox, have outsized impact on perceived quality. The technical implementation working isn't enough. It has to feel right.

## What's next for Viber

Viber is just beginning. The foundation is solid, but there's so much more to build.

Move beyond the input-stream hack to proper WebSocket-based event communication between the generation process and voice agent. Add the ability to save projects, return to them later, and share them with others. Give the voice agent access to browser console errors so it can see what went wrong and fix issues autonomously.

Support for multi-file refactors, dependency updates, and architectural changes, all through conversation. Pre-configured starting points for common app types like dashboards, landing pages, and e-commerce stores.


Happy vibe coding.